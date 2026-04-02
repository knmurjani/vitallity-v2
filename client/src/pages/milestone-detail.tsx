import { useEffect, useState, useCallback } from "react";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Check,
  Pause,
  Play,
  MessageCircle,
  GitCompare,
  Target,
  X,
  ChevronDown,
  ChevronUp,
  SkipForward,
  Circle,
  CheckCircle,
} from "lucide-react";

interface MilestoneData {
  id: number;
  title: string;
  target: string | null;
  timeframe: string | null;
  status: string | null;
  movedCount: number | null;
  createdAt: string | null;
  steps: { id: number; weekNumber: number; description: string; status: string | null }[];
  history: {
    id: number;
    eventType: string;
    oldTarget: string | null;
    newTarget: string | null;
    oldTimeframe: string | null;
    newTimeframe: string | null;
    reasonCategory: string | null;
    reasonText: string | null;
    createdAt: string | null;
  }[];
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  planned: { label: "Planned", cls: "bg-muted text-text-mid" },
  active: { label: "In Progress", cls: "bg-primary/10 text-primary" },
  paused: { label: "Paused", cls: "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" },
  completed: { label: "Completed", cls: "bg-primary/10 text-primary" },
};

const REASON_CHIPS = ["Illness/Injury", "Travel", "Plateau", "Was Overcommitted", "Life Event", "Doctor's Advice", "Progressing Faster", "Other"];
const TIMEFRAME_OPTIONS = ["1 week", "2 weeks", "1 month", "2 months", "3 months"];

export default function MilestoneDetail() {
  const authFetch = useAuthFetch();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/milestone/:id");
  const milestoneId = params?.id;

  const [data, setData] = useState<MilestoneData | null>(null);
  const [loading, setLoading] = useState(true);

  // Adjustment modal state
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjTarget, setAdjTarget] = useState("");
  const [adjTimeframe, setAdjTimeframe] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjReasonText, setAdjReasonText] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);

  // Completion celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Step skip reason
  const [skipStepId, setSkipStepId] = useState<number | null>(null);
  const [skipReason, setSkipReason] = useState("");

  // Expanded weeks
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const fetchMilestone = useCallback(async () => {
    if (!milestoneId) return;
    try {
      const res = await authFetch("GET", `/api/milestones/${milestoneId}`);
      const d = await res.json();
      setData(d.milestone);
    } catch {} finally {
      setLoading(false);
    }
  }, [milestoneId, authFetch]);

  useEffect(() => { fetchMilestone(); }, [fetchMilestone]);

  const toggleWeek = (wk: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      next.has(wk) ? next.delete(wk) : next.add(wk);
      return next;
    });
  };

  const updateStepStatus = useCallback(async (stepId: number, status: string, reason?: string) => {
    if (!data) return;
    try {
      await authFetch("POST", `/api/milestones/${data.id}/step/${stepId}`, { status, reason });
      fetchMilestone();
    } catch {}
    setSkipStepId(null);
    setSkipReason("");
  }, [data, authFetch, fetchMilestone]);

  const handlePauseResume = useCallback(async () => {
    if (!data) return;
    const newStatus = data.status === "paused" ? "active" : "paused";
    try {
      await authFetch("PUT", `/api/milestones/${data.id}`, { status: newStatus });
      fetchMilestone();
    } catch {}
  }, [data, authFetch, fetchMilestone]);

  const handleComplete = useCallback(async () => {
    if (!data) return;
    setCompleting(true);
    try {
      await authFetch("POST", `/api/milestones/${data.id}/complete`);
      await fetchMilestone();
      setShowCelebration(true);
    } catch {} finally {
      setCompleting(false);
    }
  }, [data, authFetch, fetchMilestone]);

  const handleAdjust = useCallback(async () => {
    if (!data || !adjReason) return;
    setAdjSaving(true);
    try {
      await authFetch("POST", `/api/milestones/${data.id}/adjust`, {
        newTarget: adjTarget,
        newTimeframe: adjTimeframe,
        reasonCategory: adjReason,
        reasonText: adjReasonText,
      });
      setShowAdjust(false);
      fetchMilestone();
    } catch {} finally {
      setAdjSaving(false);
    }
  }, [data, adjTarget, adjTimeframe, adjReason, adjReasonText, authFetch, fetchMilestone]);

  const handleDiscuss = useCallback(async () => {
    if (!data) return;
    try {
      await authFetch("POST", `/api/milestones/${data.id}/discuss`);
      setLocation("/dashboard");
    } catch {}
  }, [data, authFetch, setLocation]);

  const openAdjust = () => {
    if (data) {
      setAdjTarget(data.target || "");
      setAdjTimeframe(data.timeframe || "");
      setAdjReason("");
      setAdjReasonText("");
    }
    setShowAdjust(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-text-mid">Milestone not found</p>
        <button onClick={() => setLocation("/dashboard")} className="vitallity-btn-primary px-6" aria-label="Back to dashboard">Back to Dashboard</button>
      </div>
    );
  }

  const badge = STATUS_BADGE[data.status || "planned"];
  const stepsCompleted = data.steps.filter(s => s.status === "done").length;
  const totalSteps = data.steps.length;
  const adjustments = data.history.filter(h => h.eventType === "adjusted");

  // Completion celebration overlay
  if (showCelebration) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center" data-testid="celebration-screen">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle className="w-14 h-14 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-3">Milestone Achieved!</h1>
        <p className="text-text-mid mb-2">You completed "{data.title}"</p>
        {(data.movedCount || 0) > 0 && (
          <p className="text-sm text-[hsl(var(--accent))] mb-4">
            Adjusted {data.movedCount} time{(data.movedCount || 0) !== 1 ? "s" : ""} along the way -- that's real-world adaptation.
          </p>
        )}
        <div className="flex flex-col gap-3 w-full max-w-xs mt-6">
          <button onClick={() => setLocation("/dashboard")} className="vitallity-btn-primary w-full" aria-label="Back to dashboard">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36" data-testid="milestone-detail-page">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#2C5E3F] to-[#3A7A52] px-5 pt-6 pb-6">
        <div className="max-w-[560px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setLocation("/dashboard")} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back to dashboard">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-white">{data.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                {data.timeframe && <span className="text-white/60 text-xs">{data.timeframe}</span>}
              </div>
            </div>
          </div>
          {data.target && (
            <p className="text-white/80 text-sm">Target: {data.target}</p>
          )}
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-5 py-6 space-y-6">
        {/* Progress summary */}
        <div className="vitallity-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground">Progress</p>
            <p className="text-sm text-primary font-semibold">{stepsCompleted}/{totalSteps} steps</p>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Weekly Timeline */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Weekly Steps</h2>
          <div className="space-y-2">
            {data.steps.map((step) => {
              const isExpanded = expandedWeeks.has(step.weekNumber);
              return (
                <div key={step.id} className="vitallity-card overflow-hidden">
                  <button
                    onClick={() => toggleWeek(step.weekNumber)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                    aria-label={`Week ${step.weekNumber}: ${step.description}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === "done" ? "bg-primary text-white" :
                      step.status === "skipped" ? "bg-muted text-text-mid" :
                      "bg-primary/10 text-primary"
                    }`}>
                      {step.status === "done" ? <Check className="w-4 h-4" /> :
                       step.status === "skipped" ? <SkipForward className="w-3.5 h-3.5" /> :
                       <span className="text-xs font-bold">{step.weekNumber}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Week {step.weekNumber}</p>
                      <p className="text-xs text-text-mid truncate">{step.description}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-mid" /> : <ChevronDown className="w-4 h-4 text-text-mid" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-border pt-2">
                      <p className="text-sm text-foreground mb-3">{step.description}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStepStatus(step.id, step.status === "done" ? "pending" : "done")}
                          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                            step.status === "done" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                          }`}
                          aria-label={step.status === "done" ? "Mark as pending" : "Mark as done"}
                        >
                          {step.status === "done" ? "Done" : "Mark Done"}
                        </button>
                        {step.status !== "done" && (
                          <button
                            onClick={() => {
                              if (skipStepId === step.id) {
                                updateStepStatus(step.id, "skipped", skipReason);
                              } else {
                                setSkipStepId(step.id);
                              }
                            }}
                            className="flex-1 text-xs font-semibold py-2 rounded-lg bg-muted text-text-mid"
                            aria-label="Skip this step"
                          >
                            Skip
                          </button>
                        )}
                      </div>
                      {skipStepId === step.id && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={skipReason}
                            onChange={(e) => setSkipReason(e.target.value)}
                            className="vitallity-input text-xs w-full mb-2"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => updateStepStatus(step.id, "skipped", skipReason)} className="flex-1 text-xs py-1.5 rounded-lg bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] font-semibold">Confirm Skip</button>
                            <button onClick={() => { setSkipStepId(null); setSkipReason(""); }} className="flex-1 text-xs py-1.5 rounded-lg bg-muted text-text-mid font-semibold">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Adjustment History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitCompare className="w-4 h-4 text-[hsl(var(--slate))]" />
            <h2 className="text-sm font-semibold text-foreground">Adjustment History</h2>
          </div>
          {adjustments.length === 0 ? (
            <p className="text-xs text-text-mid">Original target -- no adjustments yet</p>
          ) : (
            <div className="space-y-2">
              {adjustments.map((adj) => (
                <div key={adj.id} className="vitallity-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {adj.reasonCategory && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]">
                        {adj.reasonCategory}
                      </span>
                    )}
                    <span className="text-[10px] text-text-mid">{adj.createdAt ? new Date(adj.createdAt).toLocaleDateString() : ""}</span>
                  </div>
                  {adj.oldTarget && adj.newTarget && adj.oldTarget !== adj.newTarget && (
                    <p className="text-xs text-foreground">{adj.oldTarget} → {adj.newTarget}</p>
                  )}
                  {adj.oldTimeframe && adj.newTimeframe && adj.oldTimeframe !== adj.newTimeframe && (
                    <p className="text-xs text-text-mid">{adj.oldTimeframe} → {adj.newTimeframe}</p>
                  )}
                  {adj.reasonText && <p className="text-xs text-text-mid mt-1">{adj.reasonText}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-30">
        <div className="max-w-[560px] mx-auto flex gap-2">
          {data.status !== "completed" && (
            <>
              <button onClick={handleComplete} disabled={completing} className="flex-1 vitallity-btn-primary text-sm py-3" aria-label="Mark milestone complete">
                {completing ? "..." : "Mark Complete"}
              </button>
              <button onClick={openAdjust} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground" aria-label="Adjust goalpost">
                Adjust
              </button>
              <button onClick={handlePauseResume} className="w-12 h-12 rounded-xl border border-border flex items-center justify-center" aria-label={data.status === "paused" ? "Resume" : "Pause"}>
                {data.status === "paused" ? <Play className="w-4 h-4 text-primary" /> : <Pause className="w-4 h-4 text-[hsl(var(--gold))]" />}
              </button>
              <button onClick={handleDiscuss} className="w-12 h-12 rounded-xl border border-border flex items-center justify-center" aria-label="Discuss with coach">
                <MessageCircle className="w-4 h-4 text-primary" />
              </button>
            </>
          )}
          {data.status === "completed" && (
            <button onClick={() => setLocation("/dashboard")} className="flex-1 vitallity-btn-primary text-sm py-3" aria-label="Back to dashboard">
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjust && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowAdjust(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[51] flex justify-center">
            <div className="w-full max-w-[600px] bg-background rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-display text-lg font-bold text-foreground">Adjust Goalpost</h2>
                <button onClick={() => setShowAdjust(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="vitallity-label">New Target</label>
                  <input type="text" value={adjTarget} onChange={(e) => setAdjTarget(e.target.value)} className="vitallity-input w-full" />
                </div>
                <div>
                  <label className="vitallity-label">Timeframe</label>
                  <select value={adjTimeframe} onChange={(e) => setAdjTimeframe(e.target.value)} className="vitallity-input w-full">
                    <option value="">Select...</option>
                    {TIMEFRAME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="vitallity-label">Reason *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {REASON_CHIPS.map(r => (
                      <button
                        key={r}
                        onClick={() => setAdjReason(r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          adjReason === r ? "bg-primary text-white" : "bg-muted text-foreground"
                        }`}
                        aria-label={`Reason: ${r}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="vitallity-label">Details (optional)</label>
                  <textarea value={adjReasonText} onChange={(e) => setAdjReasonText(e.target.value)} className="vitallity-input w-full h-20 resize-none" />
                </div>
                <button
                  onClick={handleAdjust}
                  disabled={!adjReason || adjSaving}
                  className="vitallity-btn-primary w-full disabled:opacity-50"
                  aria-label="Save adjustment"
                >
                  {adjSaving ? "Saving..." : "Save Adjustment"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
