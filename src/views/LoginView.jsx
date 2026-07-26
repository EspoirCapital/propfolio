import { useState } from "react";
import { BrandMark } from "../components/BrandMark";

export function LoginView({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) return;
    const userId = trimmedEmail ? trimmedEmail.toLowerCase().replace(/[^a-z0-9]/g, "_") : trimmedName.toLowerCase().replace(/\s+/g, "_");
    onLogin({ userId, name: trimmedName, email: trimmedEmail });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "var(--ink)" }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <BrandMark style={{ width: 160, height: 46 }} />
        </div>
        <div className="rounded-lg p-6" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
          <h2 className="pd-display text-xl mb-1" style={{ fontWeight: 700 }}>Welcome</h2>
          <p className="text-sm mb-5" style={{ color: "var(--slate)" }}>Enter your details to get started.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="pd-label mb-1">Name</div>
              <input className="pd-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
            </div>
            <div>
              <div className="pd-label mb-1">Email</div>
              <input className="pd-input" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="pd-btn pd-btn-primary w-full mt-1">Continue</button>
          </form>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "var(--slate)" }}>No password needed yet. Convex auth coming soon.</p>
      </div>
    </div>
  );
}
