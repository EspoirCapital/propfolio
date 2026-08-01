import { createContext, useContext, useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useDerived } from "./hooks";
import { DEFAULT_SETTINGS } from "./utils";

const AppContext = createContext(null);

const ACCOUNT_FIELDS = ["firm", "template", "size", "platform", "creationDate", "terminationDate", "status", "drawdown", "maxLoss", "dailyLoss", "costs", "platformLogin", "platformPassword", "platformInvestorPassword", "platformLink"];
const TRADE_FIELDS = ["accountId", "date", "symbol", "side", "lots", "risk", "pnl", "session", "tag", "tvLink", "rating", "notes", "mfeR", "maeR"];
const PAYOUT_FIELDS = ["accountId", "requestedDate", "amount", "split", "method", "proofLink"];
const CERT_FIELDS = ["accountId", "type", "date", "link", "label"];
const TEMPLATE_FIELDS = ["firm", "name", "phases", "target", "dailyLoss", "maxLoss", "drawdown", "consistency", "feeRefund", "platforms"];

const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]).filter(([, v]) => v !== undefined));

export function AppProvider({ children }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  const me = useQuery(api.users.me);
  const accounts = useQuery(api.accounts.list);
  const trades = useQuery(api.trades.list);
  const payouts = useQuery(api.payouts.list);
  const certificates = useQuery(api.certificates.list);
  const templates = useQuery(api.templates.list);
  const clusters = useQuery(api.clusters.list);
  const settingsRow = useQuery(api.settings.get);
  const users = useQuery(api.users.list);
  const invites = useQuery(api.invites.list);

  const createAccountFn = useMutation(api.accounts.create);
  const updateAccountFn = useMutation(api.accounts.update);
  const deleteAccountFn = useMutation(api.accounts.remove);
  const proceedFn = useMutation(api.accounts.proceed);
  const breachFn = useMutation(api.accounts.breach);
  const archiveFn = useMutation(api.accounts.archive);
  const unarchiveFn = useMutation(api.accounts.unarchive);

  const createTradeFn = useMutation(api.trades.create);
  const updateTradeFn = useMutation(api.trades.update);
  const deleteTradeFn = useMutation(api.trades.remove);

  const createPayoutFn = useMutation(api.payouts.create);
  const updatePayoutFn = useMutation(api.payouts.update);
  const deletePayoutFn = useMutation(api.payouts.remove);

  const createCertificateFn = useMutation(api.certificates.create);
  const updateCertificateFn = useMutation(api.certificates.update);
  const deleteCertificateFn = useMutation(api.certificates.remove);

  const createTemplateFn = useMutation(api.templates.create);
  const updateTemplateFn = useMutation(api.templates.update);
  const deleteTemplateFn = useMutation(api.templates.remove);

  const createClusterFn = useMutation(api.clusters.create);
  const updateClusterFn = useMutation(api.clusters.update);
  const deleteClusterFn = useMutation(api.clusters.remove);

  const updateSettingsFn = useMutation(api.settings.update);
  const updateProfileFn = useMutation(api.users.updateProfile);
  const setRoleFn = useMutation(api.users.setRole);

  const generateInviteFn = useMutation(api.invites.generate);
  const revokeInviteFn = useMutation(api.invites.revoke);

  const changePasswordFn = useAction(api.users.changePassword);

  const [selectedId, setSelectedId] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

  const session = useMemo(() => {
    if (!me) return null;
    return { userId: me.id, name: me.name, email: me.email, isAdmin: me.isAdmin };
  }, [me]);

  const settings = useMemo(() => {
    if (!settingsRow) return DEFAULT_SETTINGS;
    return { displayFormat: settingsRow.displayFormat, beThreshold: settingsRow.beThreshold };
  }, [settingsRow]);

  const derived = useDerived(accounts || [], trades || [], payouts || [], templates || []);
  const selectedAccount = derived.accounts.find((a) => a.id === selectedId);

  function logout() {
    signOut().catch(() => {});
  }
  function setSettings(next) {
    return updateSettingsFn({ displayFormat: next.displayFormat, beThreshold: next.beThreshold });
  }

  const createAccount = (data) => createAccountFn(pick(data, ACCOUNT_FIELDS));
  const updateAccount = (id, data) => updateAccountFn({ id, ...pick(data, ACCOUNT_FIELDS) });
  const deleteAccount = (id) => deleteAccountFn({ id });

  const createTrade = (data) => createTradeFn(pick(data, TRADE_FIELDS));
  const updateTrade = (id, data) => updateTradeFn({ id, ...pick(data, TRADE_FIELDS) });
  const deleteTrade = (id) => deleteTradeFn({ id });

  const createPayout = (data) => createPayoutFn(pick(data, PAYOUT_FIELDS));
  const updatePayout = (id, data) => updatePayoutFn({ id, ...pick(data, PAYOUT_FIELDS) });
  const deletePayout = (id) => deletePayoutFn({ id });

  const createCertificate = (data) => createCertificateFn(pick(data, CERT_FIELDS));
  const updateCertificate = (id, data) => updateCertificateFn({ id, ...pick(data, CERT_FIELDS) });
  const deleteCertificate = (id) => deleteCertificateFn({ id });

  const createTemplate = (data) => createTemplateFn(pick(data, TEMPLATE_FIELDS));
  const updateTemplate = (id, data) => updateTemplateFn({ id, ...pick(data, TEMPLATE_FIELDS) });
  const deleteTemplate = (id) => deleteTemplateFn({ id });

  const createCluster = (data) => createClusterFn(data);
  const updateCluster = (id, data) => updateClusterFn({ id, ...data });
  const deleteCluster = (id) => deleteClusterFn({ id });

  return (
    <AppContext.Provider value={{
      isLoading, isAuthenticated,
      session, logout,
      settings, setSettings,
      accounts: accounts || [], trades: trades || [], payouts: payouts || [],
      certificates: certificates || [], templates: templates || [], clusters: clusters || [],
      createAccount, updateAccount, deleteAccount,
      proceed: proceedFn, breach: breachFn,
      createTrade, updateTrade, deleteTrade,
      createPayout, updatePayout, deletePayout,
      createCertificate, updateCertificate, deleteCertificate,
      createTemplate, updateTemplate, deleteTemplate,
      createCluster, updateCluster, deleteCluster,
      updateProfile: (data) => updateProfileFn(data),
      changePassword: (currentPassword, newPassword) => changePasswordFn({ currentPassword, newPassword }),
      setUserRole: (id, isAdmin) => setRoleFn({ id, isAdmin }),
      users: users || [], invites: invites || [],
      generateInvite: () => generateInviteFn(),
      revokeInvite: (id) => revokeInviteFn({ id }),
      selectedId, setSelectedId,
      selectedAccount,
      editingAccount, setEditingAccount,
      derived,
      archiveAccount: (id) => archiveFn({ id }), unarchiveAccount: (id) => unarchiveFn({ id }),
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
