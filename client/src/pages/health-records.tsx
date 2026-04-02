import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthFetch } from "@/hooks/use-auth";
import {
  FileText, Plus, ArrowLeft, Calendar, Building2, Camera, Trash2,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Loader2,
  FlaskConical, Pill, ScanLine, ClipboardList, X, Check,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Blood Report Parameters ────────────────────────────────
const BLOOD_REPORT_PARAMS = [
  { name: "Fasting Blood Sugar", unit: "mg/dL", normalRange: "70-100", category: "Blood Sugar" },
  { name: "Post-Prandial Blood Sugar", unit: "mg/dL", normalRange: "< 140", category: "Blood Sugar" },
  { name: "HbA1c", unit: "%", normalRange: "4.0-5.6", category: "Blood Sugar" },
  { name: "Total Cholesterol", unit: "mg/dL", normalRange: "< 200", category: "Lipid Profile" },
  { name: "LDL Cholesterol", unit: "mg/dL", normalRange: "< 100", category: "Lipid Profile" },
  { name: "HDL Cholesterol", unit: "mg/dL", normalRange: "> 40", category: "Lipid Profile" },
  { name: "Triglycerides", unit: "mg/dL", normalRange: "< 150", category: "Lipid Profile" },
  { name: "VLDL", unit: "mg/dL", normalRange: "5-40", category: "Lipid Profile" },
  { name: "TSH", unit: "mIU/L", normalRange: "0.4-4.0", category: "Thyroid" },
  { name: "T3", unit: "ng/dL", normalRange: "80-200", category: "Thyroid" },
  { name: "T4", unit: "mcg/dL", normalRange: "4.5-12.5", category: "Thyroid" },
  { name: "Hemoglobin", unit: "g/dL", normalRange: "12-17.5", category: "CBC" },
  { name: "WBC Count", unit: "cells/mcL", normalRange: "4000-11000", category: "CBC" },
  { name: "Platelet Count", unit: "lakh/mcL", normalRange: "1.5-4.0", category: "CBC" },
  { name: "RBC Count", unit: "million/mcL", normalRange: "4.2-6.1", category: "CBC" },
  { name: "Creatinine", unit: "mg/dL", normalRange: "0.7-1.3", category: "Kidney" },
  { name: "Blood Urea", unit: "mg/dL", normalRange: "7-20", category: "Kidney" },
  { name: "Uric Acid", unit: "mg/dL", normalRange: "3.5-7.2", category: "Kidney" },
  { name: "eGFR", unit: "mL/min", normalRange: "> 90", category: "Kidney" },
  { name: "SGOT (AST)", unit: "U/L", normalRange: "8-45", category: "Liver" },
  { name: "SGPT (ALT)", unit: "U/L", normalRange: "7-56", category: "Liver" },
  { name: "Bilirubin (Total)", unit: "mg/dL", normalRange: "0.1-1.2", category: "Liver" },
  { name: "Albumin", unit: "g/dL", normalRange: "3.5-5.0", category: "Liver" },
  { name: "Vitamin D", unit: "ng/mL", normalRange: "30-100", category: "Vitamins" },
  { name: "Vitamin B12", unit: "pg/mL", normalRange: "200-900", category: "Vitamins" },
  { name: "Iron", unit: "mcg/dL", normalRange: "60-170", category: "Vitamins" },
  { name: "Ferritin", unit: "ng/mL", normalRange: "12-300", category: "Vitamins" },
  { name: "Calcium", unit: "mg/dL", normalRange: "8.5-10.5", category: "Vitamins" },
];

const RECORD_TYPES = [
  { type: "blood_report", label: "Blood Report", icon: FlaskConical, color: "text-rose" },
  { type: "prescription", label: "Prescription", icon: Pill, color: "text-slate" },
  { type: "scan", label: "Scan / Imaging", icon: ScanLine, color: "text-violet" },
  { type: "lab_test", label: "Lab Test", icon: ClipboardList, color: "text-gold" },
  { type: "other", label: "Other", icon: FileText, color: "text-text-mid" },
];

function getParamStatus(value: string, normalRange: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "normal";
  if (normalRange.startsWith("<")) {
    const max = parseFloat(normalRange.replace("<", "").trim());
    return num <= max ? "normal" : num <= max * 1.1 ? "borderline" : "high";
  }
  if (normalRange.startsWith(">")) {
    const min = parseFloat(normalRange.replace(">", "").trim());
    return num >= min ? "normal" : num >= min * 0.9 ? "borderline" : "low";
  }
  const parts = normalRange.split("-").map(s => parseFloat(s.trim()));
  if (parts.length === 2) {
    if (num < parts[0]) return num >= parts[0] * 0.9 ? "borderline" : "low";
    if (num > parts[1]) return num <= parts[1] * 1.1 ? "borderline" : "high";
    return "normal";
  }
  return "normal";
}

const STATUS_COLORS: Record<string, string> = {
  normal: "text-primary bg-primary/10",
  borderline: "text-gold bg-gold/10",
  high: "text-rose bg-rose/10",
  low: "text-slate bg-slate/10",
};

interface RecordData {
  id?: number;
  type: string;
  title: string;
  date: string;
  provider: string;
  notes: string;
  imageData: string | null;
  parameters: { name: string; value: string; unit: string; normalRange: string; status: string }[];
}

export default function HealthRecordsPage() {
  const authFetch = useAuthFetch();
  const [, setLocation] = useLocation();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "add" | "detail">("list");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<RecordData>({
    type: "blood_report",
    title: "",
    date: today,
    provider: "",
    notes: "",
    imageData: null,
    parameters: [],
  });

  const loadRecords = useCallback(async () => {
    try {
      const res = await authFetch("GET", "/api/health-records");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const startAdd = (type: string) => {
    const typeLabel = RECORD_TYPES.find(t => t.type === type)?.label || "Record";
    setForm({
      type,
      title: `${typeLabel} -- ${new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`,
      date: today,
      provider: "",
      notes: "",
      imageData: null,
      parameters: [],
    });
    setView("add");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setForm(f => ({ ...f, imageData: canvas.toDataURL("image/jpeg", 0.8) }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleParam = (param: typeof BLOOD_REPORT_PARAMS[0]) => {
    const existing = form.parameters.find(p => p.name === param.name);
    if (existing) {
      setForm(f => ({ ...f, parameters: f.parameters.filter(p => p.name !== param.name) }));
    } else {
      setForm(f => ({
        ...f,
        parameters: [...f.parameters, { name: param.name, value: "", unit: param.unit, normalRange: param.normalRange, status: "normal" }],
      }));
    }
  };

  const updateParamValue = (name: string, value: string) => {
    setForm(f => ({
      ...f,
      parameters: f.parameters.map(p => {
        if (p.name !== name) return p;
        const status = getParamStatus(value, p.normalRange);
        return { ...p, value, status };
      }),
    }));
  };

  const saveRecord = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = {
        type: form.type,
        title: form.title,
        date: form.date,
        provider: form.provider || null,
        notes: form.notes || null,
        imageData: form.imageData,
        parameters: form.parameters.filter(p => p.value),
      };
      await authFetch("POST", "/api/health-records", body);
      await loadRecords();
      setView("list");
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      await authFetch("DELETE", `/api/health-records/${id}`);
      await loadRecords();
      setView("list");
      setSelectedRecord(null);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const viewDetail = async (id: number) => {
    try {
      const res = await authFetch("GET", `/api/health-records/${id}`);
      const data = await res.json();
      setSelectedRecord(data);
      setView("detail");
    } catch (err) {
      console.error("Failed to load record:", err);
    }
  };

  const typeConfig = (type: string) => RECORD_TYPES.find(t => t.type === type) || RECORD_TYPES[4];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // ─── Detail View ──────────────────────────────────────────
  if (view === "detail" && selectedRecord) {
    const tc = typeConfig(selectedRecord.type);
    const Icon = tc.icon;
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[560px] mx-auto px-5 py-6 pb-24">
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-text-mid mb-4 hover:text-foreground transition-colors" data-testid="back-to-list">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="glass-card p-5 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc.color} bg-current/10`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold" data-testid="record-title">{selectedRecord.title}</h2>
                <p className="text-xs text-text-light mt-0.5">{selectedRecord.date} {selectedRecord.provider && `-- ${selectedRecord.provider}`}</p>
              </div>
            </div>

            {selectedRecord.imageData && (
              <img src={selectedRecord.imageData} alt="Record" className="w-full rounded-xl mb-4" data-testid="record-image" />
            )}

            {selectedRecord.notes && (
              <p className="text-sm text-text-mid mb-4">{selectedRecord.notes}</p>
            )}
          </div>

          {selectedRecord.parametersList?.length > 0 && (
            <div className="glass-card p-5 mb-4">
              <h3 className="font-display text-lg font-bold mb-3">Parameters</h3>
              <div className="space-y-2">
                {selectedRecord.parametersList.map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-text-light ml-2">({p.normalRange})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold">{p.value} {p.unit}</span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] || STATUS_COLORS.normal}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => deleteRecord(selectedRecord.id)}
            className="w-full py-3 text-sm text-rose font-medium rounded-2xl border border-rose/20 hover:bg-rose/5 transition-colors flex items-center justify-center gap-2"
            data-testid="delete-record"
          >
            <Trash2 className="w-4 h-4" /> Delete Record
          </button>
        </div>
      </div>
    );
  }

  // ─── Add View ─────────────────────────────────────────────
  if (view === "add") {
    const isBloodReport = form.type === "blood_report";
    const grouped = isBloodReport
      ? BLOOD_REPORT_PARAMS.reduce<Record<string, typeof BLOOD_REPORT_PARAMS>>((acc, p) => {
          (acc[p.category] = acc[p.category] || []).push(p);
          return acc;
        }, {})
      : {};

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[560px] mx-auto px-5 py-6 pb-32">
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-text-mid mb-4 hover:text-foreground transition-colors" data-testid="cancel-add">
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>

          <h1 className="font-display text-2xl font-bold mb-6">Add {typeConfig(form.type).label}</h1>

          <div className="space-y-5">
            <div>
              <label className="vitallity-label">Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="vitallity-input" data-testid="record-title-input" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="vitallity-label">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="vitallity-input" data-testid="record-date-input" />
              </div>
              <div className="flex-1">
                <label className="vitallity-label">Provider / Lab</label>
                <input type="text" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="e.g. Apollo Diagnostics" className="vitallity-input" data-testid="record-provider-input" />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label className="vitallity-label">Photo</label>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
              {form.imageData ? (
                <div className="relative">
                  <img src={form.imageData} alt="Upload" className="w-full rounded-xl" />
                  <button onClick={() => setForm(f => ({ ...f, imageData: null }))} className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white" data-testid="remove-image">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-sm text-text-light flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
                  data-testid="upload-photo"
                >
                  <Camera className="w-5 h-5" /> Take Photo or Upload
                </button>
              )}
            </div>

            {/* Blood report parameters */}
            {isBloodReport && (
              <div>
                <label className="vitallity-label">Test Parameters</label>
                <p className="text-xs text-text-light mb-3">Select the tests you have results for, then enter values</p>

                {Object.entries(grouped).map(([category, params]) => (
                  <div key={category} className="mb-4">
                    <p className="text-xs font-semibold text-text-mid uppercase tracking-wider mb-2">{category}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {params.map(p => {
                        const active = form.parameters.some(fp => fp.name === p.name);
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => toggleParam(p)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              active ? "bg-primary/10 border-primary text-primary" : "border-border text-text-mid hover:border-primary/50"
                            }`}
                            data-testid={`param-toggle-${p.name.toLowerCase().replace(/[\s()\/]+/g, "-")}`}
                          >
                            {active && <Check className="w-3 h-3 inline mr-1" />}
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Value entry for selected parameters */}
                {form.parameters.length > 0 && (
                  <div className="glass-card p-4 space-y-3 mt-4">
                    {form.parameters.map(p => (
                      <div key={p.name} className="flex items-center gap-2">
                        <span className="text-xs font-medium w-32 truncate">{p.name}</span>
                        <input
                          type="number"
                          step="any"
                          value={p.value}
                          onChange={e => updateParamValue(p.name, e.target.value)}
                          placeholder="Value"
                          className="vitallity-input flex-1 py-2 text-sm font-mono"
                          data-testid={`param-value-${p.name.toLowerCase().replace(/[\s()\/]+/g, "-")}`}
                        />
                        <span className="text-xs text-text-light w-16 text-right">{p.unit}</span>
                        {p.value && (
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[p.status] || STATUS_COLORS.normal}`}>
                            {p.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="vitallity-label">Notes <span className="normal-case text-text-faint">(optional)</span></label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder="Any additional notes..."
                className="vitallity-input resize-none"
                data-testid="record-notes-input"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-5 py-4">
            <div className="max-w-[560px] mx-auto">
              <button
                onClick={saveRecord}
                disabled={saving || !form.title.trim()}
                className="vitallity-btn-primary w-full flex items-center justify-center gap-2"
                data-testid="save-record"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Record
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[560px] mx-auto px-5 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/dashboard")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted/50 transition-colors" data-testid="back-to-dashboard">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-display text-2xl font-bold">Health Records</h1>
          </div>
        </div>

        {/* Add Record Types */}
        <div className="grid grid-cols-3 gap-2 mb-6" data-testid="add-record-types">
          {RECORD_TYPES.map(rt => {
            const Icon = rt.icon;
            return (
              <button
                key={rt.type}
                onClick={() => startAdd(rt.type)}
                className="glass-card p-3 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors active:scale-[0.97]"
                data-testid={`add-${rt.type}`}
              >
                <Icon className={`w-5 h-5 ${rt.color}`} />
                <span className="text-[11px] font-medium text-text-mid text-center leading-tight">{rt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Records timeline */}
        {records.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-text-faint mx-auto mb-3" />
            <p className="text-sm text-text-mid font-medium">No records yet</p>
            <p className="text-xs text-text-light mt-1">Add your first health record to get started</p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="records-list">
            {records.map((record, i) => {
              const tc = typeConfig(record.type);
              const Icon = tc.icon;
              const isExpanded = expandedId === record.id;
              return (
                <div
                  key={record.id}
                  className="glass-card p-4 cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99] animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => viewDetail(record.id)}
                  data-testid={`record-${record.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tc.color} bg-current/10`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{record.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3 text-text-light" />
                        <span className="text-xs text-text-light">{record.date}</span>
                        {record.provider && (
                          <>
                            <Building2 className="w-3 h-3 text-text-light ml-1" />
                            <span className="text-xs text-text-light truncate">{record.provider}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-text-light shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
