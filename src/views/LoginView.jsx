import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { BrandMark } from "../components/BrandMark";
import { ErrorBanner } from "../components/ErrorBanner";
import { friendlyError } from "../utils";

export function LoginView() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) {
      setInviteCode(invite);
      setMode("signup");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signIn("password", {
          flow: "signUp",
          email: email.trim(),
          password,
          name: name.trim(),
          inviteCode: inviteCode.trim(),
        });
      } else {
        await signIn("password", { flow: "signIn", email: email.trim(), password });
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "var(--ink)" }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <BrandMark style={{ width: 160, height: 46 }} />
        </div>
        <div className="rounded-lg p-6" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <h2 className="pd-display text-xl mb-1" style={{ fontWeight: 700 }}>
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--slate)" }}>
            {mode === "signup" ? "Invite-only. Enter the code from your invite link." : "Enter your details to continue."}
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div>
                <div className="pd-label mb-1">Name</div>
                <input className="pd-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
              </div>
            )}
            <div>
              <div className="pd-label mb-1">Email</div>
              <input className="pd-input" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={mode === "signin"} required />
            </div>
            <div>
              <div className="pd-label mb-1">Password</div>
              <input className="pd-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>
            {mode === "signup" && (
              <div>
                <div className="pd-label mb-1">Invite code</div>
                <input className="pd-input pd-mono" placeholder="ECP-XXXX-XXXX-XXXX" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
              </div>
            )}
            {error && (
              <ErrorBanner message={error} onDismiss={() => setError("")} />
            )}
            <button type="submit" className="pd-btn pd-btn-primary w-full mt-1" disabled={busy}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-xs no-underline"
              style={{ color: "var(--brass)", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
            >
              {mode === "signup" ? "Have an account? Sign in" : "No account yet? Need an invite"}
            </button>
          </div>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "var(--slate)" }}>EC PROPFOLIO — sign-ups are by invite only.</p>
      </div>
    </div>
  );
}
