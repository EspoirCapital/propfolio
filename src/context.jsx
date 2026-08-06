import { createContext, useContext, useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useDerived } from "./hooks";
import { DEFAULT_SETTINGS } from "./utils";

const AppContext = createContext(null);

const ACCOUNT_FIELDS = ["firmId", "templateId", "size", "platform", "creationDate", "terminationDate", "status", "drawdown", "maxLoss", "dailyLoss", "costs", "platformLogin", "platformPassword", "platformInvestorPassword"];
const TRADE_FIELDS = ["accountId", "date", "symbol", "side", "lots", "risk", "pnl", "session", "tag", "tvLink", "rating", "notes", "mfeR", "maeR"];
const PAYOUT_FIELDS = ["accountId", "requestedDate", "amount", "split", "method", "proofLink"];
const CERT_FIELDS = ["accountId", "type", "date", "link", "label"];
const TEMPLATE_FIELDS = ["firmId", "name", "phases", "target", "dailyLoss", "maxLoss", "drawdown", "consistency", "feeRefund", "platforms"];
const FIRM_FIELDS = ["name", "platformLink"];

const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]).filter(([, v]) => v !== undefined));

export function AppProvider({ children }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  const me = useQuery(api.users.me);
  const accounts = useQuery(api.accounts.list);
  const trades = useQuery(api.trades.list);
  const payouts = useQuery(api.payouts.list);
  const certificates = useQuery(api.certificates.list);
  const templates = useQuery(api.templates.list);
  const firms = useQuery(api.firms.list);
  const copyLinks = useQuery(api.copies.list);
  const settingsRow = useQuery(api.settings.get);
  const users = useQuery(api.users.list);
  const userStats = useQuery(api.users.stats);
  const invites = useQuery(api.invites.list);

  const createAccountFn = useMutation(api.accounts.create);
  const updateAccountFn = useMutation(api.accounts.update);
  const deleteAccountFn = useMutation(api.accounts.remove);
  const proceedFn = useMutation(api.accounts.proceed);
  const breachFn = useMutation(api.accounts.breach);
  const archiveFn = useMutation(api.accounts.archive);
  const unarchiveFn = useMutation(api.accounts.unarchive);
  const setBatchFn = useMutation(api.accounts.setBatch);
  const linkAccountsFn = useMutation(api.accounts.link);
  const unlinkAccountFn = useMutation(api.accounts.unlink);

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

  const createFirmFn = useMutation(api.firms.create);
  const updateFirmFn = useMutation(api.firms.update);
  const deleteFirmFn = useMutation(api.firms.remove);

  const setSlavesFn = useMutation(api.copies.setSlaves);
  const copyTradesFn = useMutation(api.copies.copyTrades);

  const updateSettingsFn = useMutation(api.settings.update);
  const updateProfileFn = useMutation(api.users.updateProfile);
  const setRoleFn = useMutation(api.users.setRole);
  const setBannedFn = useAction(api.users.setBanned);

  const generateInviteFn = useMutation(api.invites.generate);
  const revokeInviteFn = useMutation(api.invites.revoke);

  const changePasswordFn = useAction(api.users.changePassword);

  const [selectedId, setSelectedId] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

  const isLoading = authLoading || me === undefined;
  const dataReady = !isLoading && accounts !== undefined && trades !== undefined && payouts !== undefined && certificates !== undefined && templates !== undefined && firms !== undefined && copyLinks !== undefined && settingsRow !== undefined;

  const session = useMemo(() => {
    if (!me) return null;
    return { userId: me.id, name: me.name, email: me.email, isAdmin: me.isAdmin };
  }, [me]);

  const settings = useMemo(() => {
    if (!settingsRow) return DEFAULT_SETTINGS;
    return { displayFormat: settingsRow.displayFormat, beThreshold: settingsRow.beThreshold, mfeThreshold: settingsRow.mfeThreshold ?? 1 };
  }, [settingsRow]);

  const derived = useDerived(accounts || [], trades || [], payouts || [], templates || [], firms || []);
  const selectedAccount = derived.accounts.find((a) => a.id === selectedId);

  function logout() {
    signOut().catch(() => {});
  }
  function setSettings(next) {
    return updateSettingsFn({ displayFormat: next.displayFormat, beThreshold: next.beThreshold, mfeThreshold: next.mfeThreshold ?? 1 });
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

  const createFirm = (data) => createFirmFn(pick(data, FIRM_FIELDS));
  const updateFirm = (id, data) => updateFirmFn({ id, ...pick(data, FIRM_FIELDS) });
  const deleteFirm = (id) => deleteFirmFn({ id });

  const setSlaves = (masterAccountId, slaveAccountIds) => setSlavesFn({ masterAccountId, slaveAccountIds });
  const copyTrades = (masterAccountId, tradeIds, slaveAccountIds) => copyTradesFn({ masterAccountId, tradeIds, slaveAccountIds });

  const slavesByMaster = useMemo(() => {
    const map = {};
    for (const link of copyLinks || []) {
      (map[link.masterAccountId] = map[link.masterAccountId] || []).push(link.slaveAccountId);
    }
    return map;
  }, [copyLinks]);

  return (
    <AppContext.Provider value={{
      isLoading, dataReady, isAuthenticated,
      session, logout,
      settings, setSettings,
      accounts: accounts || [], trades: trades || [], payouts: payouts || [],
      certificates: certificates || [], templates: templates || [], firms: firms || [],
      copyLinks: copyLinks || [], slavesByMaster,
      createAccount, updateAccount, deleteAccount,
      proceed: proceedFn, breach: breachFn,
      linkAccounts: linkAccountsFn, unlinkAccount: unlinkAccountFn,
      createTrade, updateTrade, deleteTrade,
      createPayout, updatePayout, deletePayout,
      createCertificate, updateCertificate, deleteCertificate,
      createTemplate, updateTemplate, deleteTemplate,
      createFirm, updateFirm, deleteFirm,
      setSlaves, copyTrades,
      updateProfile: (data) => updateProfileFn(data),
      changePassword: (currentPassword, newPassword) => changePasswordFn({ currentPassword, newPassword }),
      setUserRole: (id, isAdmin) => setRoleFn({ id, isAdmin }),
      setUserBanned: (id, banned) => setBannedFn({ id, banned }),
      users: users || [], userStats: userStats || [], invites: invites || [],
      generateInvite: (maxUses, hours) => generateInviteFn({ maxUses, hours }),
      revokeInvite: (id) => revokeInviteFn({ id }),
      selectedId, setSelectedId,
      selectedAccount,
      editingAccount, setEditingAccount,
      derived,
      archiveAccount: (id) => archiveFn({ id }), unarchiveAccount: (id) => unarchiveFn({ id }),
      setBatch: (id, role) => setBatchFn({ id, role }),
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
