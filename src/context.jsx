import { createContext, useContext, useState } from "react";
import { loadSettings, loadSession, saveSession, clearSession } from "./utils";
import {
  TEMPLATES, initialAccounts, initialTrades, initialPayouts, initialCertificates, initialClusters,
} from "./constants";
import { useDerived } from "./hooks";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSessionState] = useState(loadSession);
  const [settings, setSettingsState] = useState(() => session ? loadSettings(session.userId) : { displayFormat: "dollar", beThreshold: 10 });
  const [accounts, setAccounts] = useState(initialAccounts);
  const [trades, setTrades] = useState(initialTrades);
  const [payouts, setPayouts] = useState(initialPayouts);
  const [certificates, setCertificates] = useState(initialCertificates);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [clusters, setClusters] = useState(initialClusters);
  const [selectedId, setSelectedId] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

  const derived = useDerived(accounts, trades, payouts, templates);
  const selectedAccount = derived.accounts.find((a) => a.id === selectedId);

  function login(user) {
    saveSession(user);
    setSessionState(user);
    setSettingsState(loadSettings(user.userId));
  }
  function logout() {
    clearSession();
    setSessionState(null);
  }
  function setSettings(s) {
    setSettingsState(s);
    if (session) saveSettings(session.userId, s);
  }

  const archiveAccount = (id) => {
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, archived: true } : a));
    setTrades((prev) => prev.map((t) => t.accountId === id ? { ...t, archived: true } : t));
  };
  const unarchiveAccount = (id) => {
    setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, archived: false } : a));
    setTrades((prev) => prev.map((t) => t.accountId === id ? { ...t, archived: false } : t));
  };

  return (
    <AppContext.Provider value={{
      session, login, logout,
      settings, setSettings,
      accounts, setAccounts,
      trades, setTrades,
      payouts, setPayouts,
      certificates, setCertificates,
      templates, setTemplates,
      clusters, setClusters,
      selectedId, setSelectedId,
      selectedAccount,
      editingAccount, setEditingAccount,
      derived,
      archiveAccount, unarchiveAccount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
