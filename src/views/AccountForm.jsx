import { useState } from "react";
import { STATUS_META } from "../constants";
import { DatePicker } from "../components/DatePicker";
import { Select } from "../components/Select";

export function AccountForm({ initial, templates, firms, onSave, onCancel, saving }) {
  const defaultFirmId = firms[0]?.id || "";
  const blank = {
    firmId: defaultFirmId, templateId: "", size: "", platform: "MatchTrader",
    creationDate: "", terminationDate: "", status: "phase_1", drawdown: "Static", maxLoss: "", dailyLoss: "",
    costs: [{ label: "Challenge fee", amount: "" }],
    platformLogin: "", platformPassword: "", platformInvestorPassword: "",
  };
  const [form, setForm] = useState(initial ? { ...blank, ...initial, costs: initial.costs || blank.costs } : blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function handleTemplateChange(templateId) {
    set("templateId", templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setForm((f) => ({
        ...f,
        templateId,
        firmId: tmpl.firmId,
        maxLoss: tmpl.maxLoss || "",
        dailyLoss: tmpl.dailyLoss || "",
        drawdown: tmpl.drawdown || f.drawdown,
      }));
    }
  }

  function handleFirmChange(firmId) {
    set("firmId", firmId);
    set("templateId", "");
  }

  function submit(e) {
    e.preventDefault();
    if (!form.firmId || !form.templateId || !form.size) return;
    onSave({
      ...form,
      size: parseFloat(form.size) || 0,
      costs: form.costs.map((c) => ({ ...c, amount: parseFloat(c.amount) || 0 })),
    });
  }

  const firmTemplates = templates.filter((t) => t.firmId === form.firmId);

  return (
    <form onSubmit={submit} className="rounded-lg p-4 mb-5" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div>
          <div className="pd-label mb-1">Firm</div>
          <Select value={form.firmId} onChange={(e) => handleFirmChange(e.target.value)}>
            {firms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        </div>
        <div>
          <div className="pd-label mb-1">Template</div>
          <Select value={form.templateId} onChange={(e) => handleTemplateChange(e.target.value)}>
            <option value="">Select...</option>
            {firmTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
        <div><div className="pd-label mb-1">Account size ($)</div><input required className="pd-input" placeholder="50000" value={form.size} onChange={(e) => set("size", e.target.value)} /></div>
        <div><div className="pd-label mb-1">Creation date</div><DatePicker value={form.creationDate} onChange={(v) => set("creationDate", v)} required /></div>
        <div><div className="pd-label mb-1">Termination date</div><DatePicker value={form.terminationDate} onChange={(v) => set("terminationDate", v)} /></div>
        <div>
          <div className="pd-label mb-1">Status</div>
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </Select>
        </div>
        <div>
          <div className="pd-label mb-1">Drawdown type</div>
          <Select value={form.drawdown} onChange={(e) => set("drawdown", e.target.value)}>
            <option>Static</option><option>Trailing</option>
          </Select>
        </div>
        <div><div className="pd-label mb-1">Challenge fee ($)</div><input className="pd-input" placeholder="299" value={form.costs[0]?.amount ?? ""} onChange={(e) => { const c = [...form.costs]; c[0] = { ...c[0], amount: e.target.value }; set("costs", c); }} /></div>
      </div>

      <div className="pd-label mb-2">Platform Credentials</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div><div className="pd-label mb-1">Login ID</div><input className="pd-input" placeholder="FP-208471" value={form.platformLogin} onChange={(e) => set("platformLogin", e.target.value)} /></div>
        <div><div className="pd-label mb-1">Password</div><input className="pd-input" placeholder="••••••••" value={form.platformPassword} onChange={(e) => set("platformPassword", e.target.value)} /></div>
        <div><div className="pd-label mb-1">Investor Password</div><input className="pd-input" placeholder="••••••••" value={form.platformInvestorPassword} onChange={(e) => set("platformInvestorPassword", e.target.value)} /></div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" className="pd-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="pd-btn pd-btn-primary" disabled={saving}>{saving ? "Saving…" : (initial ? "Update account" : "Add account")}</button>
      </div>
    </form>
  );
}
