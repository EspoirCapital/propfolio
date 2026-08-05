import { useState, useEffect } from "react";
import { createRouter, createRoute, createRootRoute, Link, Outlet, useRouterState, useNavigate, useSearch, useParams } from "@tanstack/react-router";
import { LayoutGrid, NotebookPen, Award, SlidersHorizontal, List, Wallet, Settings, Copy, BarChart3, LogOut, Users, Menu, X } from "lucide-react";

import { useApp } from "./context";
import { BrandMark } from "./components/BrandMark";
import { LoadingScreen } from "./components/LoadingScreen";
import { ConfirmModal } from "./components/ConfirmModal";
import { LoginView } from "./views/LoginView";
import { AccountDrawer } from "./views/AccountDrawer";
import { OverviewView } from "./views/OverviewView";
import { AccountsView } from "./views/AccountsView";
import { AccountDetailPage } from "./views/AccountDetailPage";
import { JournalView } from "./views/JournalView";
import { PayoutsView } from "./views/PayoutsView";
import { CertificatesView } from "./views/CertificatesView";
import { TemplatesView } from "./views/TemplatesView";
import { CopyJournalingView } from "./views/CopyJournalingView";
import { SettingsView } from "./views/SettingsView";
import { ReportView } from "./views/ReportView";
import { AdminView } from "./views/AdminView";

const NAV = [
  { path: "/", label: "Overview", icon: LayoutGrid },
  { path: "/accounts", label: "Accounts", icon: List },
  { path: "/journal", label: "Journal", icon: NotebookPen },
  { path: "/copytrading", label: "Copy Journaling", icon: Copy },
  { path: "/payouts", label: "Payouts", icon: Wallet },
  { path: "/certificates", label: "Certificates", icon: Award },
  { path: "/report", label: "Report", icon: BarChart3 },
];

const ADMIN_NAV = [
  { path: "/people", label: "People", icon: Users },
  { path: "/templates", label: "Firms & Rules", icon: SlidersHorizontal },
];

const PAGE_META = {
  "/": ["Overview", "Your prop trading performance, at a glance."],
  "/accounts": ["Accounts", "Every challenge and funded account — card or list view."],
  "/journal": ["Journal", "Trade-by-trade record, linked to TradingView charts."],
  "/payouts": ["Payouts", "Requested and paid — with proof."],
  "/certificates": ["Certificates", "Passing and payout proof, ready to show."],
  "/templates": ["Firms & Rules", "How each firm's challenges are structured."],
  "/copytrading": ["Copy Journaling", "Copy a master account's trades into its slave accounts, scaled by size and multiplier."],
  "/report": ["Performance Report", "Monthly fees, refunds, payouts, and net position."],
  "/settings": ["Settings", "How risk and P&L display in the journal."],
  "/people": ["People", "Invites and admin access for your workspace."],
};

function Layout() {
  const { session, isLoading, dataReady, logout, selectedAccount, setSelectedId, trades, payouts, certificates, settings, templates, archiveAccount, unarchiveAccount } = useApp();
  const router = useRouterState();
  const navigate = useNavigate();
  const pathname = router.location.pathname;
  const [showLogout, setShowLogout] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !session && pathname !== "/") {
      navigate({ to: "/", search: (prev) => prev });
    }
  }, [session, isLoading, pathname, navigate]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  if (isLoading || (session && !dataReady)) {
    return (
      <div className="pd-root">
        <div className="relative z-[1] min-h-screen">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="pd-root">
        <div className="relative z-[1] min-h-screen">
          <LoginView />
        </div>
      </div>
    );
  }

  const initials = session.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const isAccountDetail = /^\/accounts\/[^/]+$/.test(pathname);
  const meta = isAccountDetail ? ["Account", "Account details, trades, and progression."]
    : (PAGE_META[pathname] || ["", ""]);

  return (
    <div className="pd-root">
      <div className="relative z-[1] min-h-screen">
        {/* Sidebar — fixed on desktop, off-canvas drawer on mobile */}
        <aside className={`pd-sidebar p-4 ${mobileNavOpen ? "open" : ""}`} aria-label="Primary">
          <div className="flex items-center justify-between mb-6 px-2">
            <Link to="/" className="flex items-center no-underline" onClick={() => setMobileNavOpen(false)}>
              <BrandMark style={{ width: 140, height: 40 }} />
            </Link>
            <button className="md:hidden shrink-0 p-2 rounded-md" onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--slate)" }}>
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto pd-scrollbar" aria-label="Primary">
            {[...NAV, ...(session.isAdmin ? ADMIN_NAV : [])].map((n) => {
              const Icon = n.icon;
              const isActive = n.path === "/" ? pathname === "/" : pathname.startsWith(n.path);
              return (
                <Link key={n.path} to={n.path}
                  className={`pd-navitem flex items-center gap-2.5 px-3 py-2.5 rounded-r-md text-sm text-left no-underline ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileNavOpen(false)}
                  style={{ color: isActive ? "var(--sand)" : "var(--slate)" }}>
                  <Icon size={16} /> {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom pinned section */}
          <div className="mt-auto">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: "var(--ledger)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: "var(--brass)", color: "var(--ink)" }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate" style={{ color: "var(--sand)" }}>{session.name}</div>
                <div className="text-xs truncate" style={{ color: "var(--slate)" }}>{session.email || "No email"}</div>
              </div>
              <Link to="/settings" className="shrink-0 p-2 rounded-md transition-colors"
                style={{ color: pathname === "/settings" ? "var(--brass)" : "var(--slate)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brass)"}
                onMouseLeave={(e) => e.currentTarget.style.color = pathname === "/settings" ? "var(--brass)" : "var(--slate)"}>
                <Settings size={15} />
              </Link>
              <button onClick={() => setShowLogout(true)} className="shrink-0 p-2 rounded-md transition-colors" style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--brick)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--slate)"}
                title="Log out">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {mobileNavOpen && (
          <div className="pd-scrim md:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
        )}

        {showLogout && <ConfirmModal onCancel={() => setShowLogout(false)} onConfirm={() => { setShowLogout(false); logout(); }}
          title="Log out" message="Are you sure you want to log out?" confirmLabel="Log out" />}

        {/* Main content — offset by sidebar on desktop */}
        <main className="md:ml-56 min-h-screen p-5 md:p-8 pd-scrollbar overflow-y-auto">
          <div className="flex md:hidden items-center mb-4 gap-2">
            <button className="shrink-0 p-2 rounded-md" onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sand)" }}>
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <BrandMark style={{ width: 120, height: 34 }} />
          </div>

          <div key={pathname} className="pd-route">
            <div className="mb-6 no-print">
              <h1 className="pd-display text-4xl" style={{ fontWeight: 700 }}>{meta[0]}</h1>
              <p className="text-sm mt-1" style={{ color: "var(--slate)" }}>{meta[1]}</p>
            </div>

            <Outlet />
          </div>
        </main>
      </div>

      <AccountDrawer
        account={selectedAccount} trades={trades} payouts={payouts}
        certificates={certificates} settings={settings} templates={templates}
        onViewDetails={(id) => { setSelectedId(null); navigate({ to: "/accounts/$accountId", params: { accountId: id } }); }}
        onLogTrade={(id) => { setSelectedId(null); navigate({ to: "/journal", search: { account: id } }); }}
        onClose={() => setSelectedId(null)}
        archiveAccount={archiveAccount} unarchiveAccount={unarchiveAccount}
      />
    </div>
  );
}

function OverviewPage() {
  const { derived, trades, payouts, settings } = useApp();
  return <OverviewView derived={derived} trades={trades} payouts={payouts} settings={settings} />;
}

function AccountsPage() {
  const { derived, templates, firms, editingAccount, setEditingAccount, createAccount, updateAccount, deleteAccount, setSelectedId, archiveAccount, unarchiveAccount } = useApp();
  const { firm, status } = useSearch({ from: "/accounts" });
  const navigate = useNavigate();

  return (
    <AccountsView
      derived={derived} templates={templates} firms={firms}
      createAccount={createAccount} updateAccount={updateAccount} deleteAccount={deleteAccount}
      editingAccount={editingAccount} setEditingAccount={setEditingAccount}
      filterFirm={firm} setFilterFirm={(v) => navigate({ search: (prev) => ({ ...prev, firm: v }) })}
      filterStatus={status} setFilterStatus={(v) => navigate({ search: (prev) => ({ ...prev, status: v }) })}
      onRowClick={(id) => navigate({ to: "/accounts/$accountId", params: { accountId: id } })}
      onOpen={setSelectedId}
      archiveAccount={archiveAccount} unarchiveAccount={unarchiveAccount}
    />
  );
}

function AccountDetailPageRoute() {
  const { derived, trades, payouts, certificates, settings, templates, updateAccount, deleteAccount, setEditingAccount, archiveAccount, unarchiveAccount } = useApp();
  const navigate = useNavigate();
  const { accountId } = useParams({ from: "/accounts/$accountId" });

  return (
    <AccountDetailPage
      accountId={accountId} derived={derived} trades={trades}
      payouts={payouts} certificates={certificates} settings={settings}
      templates={templates} updateAccount={updateAccount}
      onBack={() => navigate({ to: "/accounts" })}
      onEdit={(id) => { const acc = derived.accounts.find((a) => a.id === id); if (acc) { setEditingAccount(acc); navigate({ to: "/accounts" }); } }}
      onDelete={deleteAccount}
      archiveAccount={archiveAccount} unarchiveAccount={unarchiveAccount}
    />
  );
}

function JournalPage() {
  const { accounts, trades, createTrade, updateTrade, deleteTrade, settings, slavesByMaster, copyTrades } = useApp();
  const { account } = useSearch({ from: "/journal" });
  const navigate = useNavigate();

  return (
    <JournalView
      accounts={accounts} trades={trades}
      createTrade={createTrade} updateTrade={updateTrade} deleteTrade={deleteTrade}
      settings={settings}
      slavesByMaster={slavesByMaster} copyTrades={copyTrades}
      account={account}
      onAccountChange={(acc) => navigate({ search: (prev) => ({ ...prev, account: acc === "All" ? undefined : acc }) })}
    />
  );
}

function PayoutsPage() {
  const { derived, payouts, createPayout, updatePayout, deletePayout } = useApp();
  return <PayoutsView accounts={derived.accounts} payouts={payouts} createPayout={createPayout} updatePayout={updatePayout} deletePayout={deletePayout} />;
}

function CertificatesPage() {
  const { derived, certificates, createCertificate, updateCertificate, deleteCertificate } = useApp();
  const { account } = useSearch({ from: "/certificates" });
  return <CertificatesView accounts={derived.accounts} certificates={certificates} createCertificate={createCertificate} updateCertificate={updateCertificate} deleteCertificate={deleteCertificate} initialAccountId={account} />;
}

function TemplatesPage() {
  const { session, templates, firms, createTemplate, updateTemplate, deleteTemplate, createFirm, updateFirm, deleteFirm } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    if (!session?.isAdmin) navigate({ to: "/" });
  }, [session, navigate]);
  if (!session?.isAdmin) return null;
  return (
    <TemplatesView
      templates={templates} firms={firms}
      createTemplate={createTemplate} updateTemplate={updateTemplate} deleteTemplate={deleteTemplate}
      createFirm={createFirm} updateFirm={updateFirm} deleteFirm={deleteFirm}
    />
  );
}

function CopytradingPage() {
  const { accounts, trades, copyLinks, slavesByMaster, setSlaves, copyTrades } = useApp();
  return <CopyJournalingView accounts={accounts} trades={trades} copyLinks={copyLinks} slavesByMaster={slavesByMaster} setSlaves={setSlaves} copyTrades={copyTrades} />;
}

function SettingsPage() {
  const { session, settings, setSettings, updateProfile, changePassword } = useApp();
  return <SettingsView settings={settings} setSettings={setSettings} session={session} updateProfile={updateProfile} changePassword={changePassword} />;
}

function ReportPage() {
  const { derived, trades, payouts, settings } = useApp();
  return <ReportView accounts={derived.accounts} trades={trades} payouts={payouts} settings={settings} />;
}

function PeoplePage() {
  const { session, users, userStats, invites, generateInvite, revokeInvite, setUserRole, setUserBanned } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    if (!session?.isAdmin) navigate({ to: "/" });
  }, [session, navigate]);
  if (!session?.isAdmin) return null;
  return <AdminView users={users} userStats={userStats} invites={invites} generateInvite={generateInvite} revokeInvite={revokeInvite} setUserRole={setUserRole} setUserBanned={setUserBanned} currentUserId={session?.userId} />;
}

const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  validateSearch: (s) => ({ firm: s.firm || "All", status: s.status || "All" }),
  component: AccountsPage,
});

const accountDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts/$accountId",
  component: AccountDetailPageRoute,
});

const journalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/journal",
  validateSearch: (s) => ({ account: s.account || undefined }),
  component: JournalPage,
});

const payoutsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payouts",
  component: PayoutsPage,
});

const certificatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/certificates",
  validateSearch: (s) => ({ account: s.account || undefined }),
  component: CertificatesPage,
});

const templatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/templates",
  component: TemplatesPage,
});

const copytradingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/copytrading",
  component: CopytradingPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const reportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/report",
  component: ReportPage,
});

const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  component: PeoplePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  accountsRoute,
  accountDetailRoute,
  journalRoute,
  payoutsRoute,
  certificatesRoute,
  templatesRoute,
  copytradingRoute,
  settingsRoute,
  reportRoute,
  peopleRoute,
]);

export const router = createRouter({ routeTree });
