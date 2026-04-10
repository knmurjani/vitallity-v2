import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth, useAuthFetch } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Target,
  TrendingDown,
  TrendingUp,
  MessageCircle,
  Settings2,
  Plus,
  ChevronRight,
  AlertTriangle,
  Pause,
  Play,
  Flag,
  Send,
  X,
  Plane,
  Thermometer,
  Brain,
  Dumbbell,
  Moon,
  Heart,
  Loader2,
  Check,
} from "lucide-react";

interface GoalData {
  id: number;
  goalType: string;
  customDescription: string | null;
  targetValue: string | null;
  targetTimeline: string | null;
  milestones: MilestoneData[];
  glidepath: GlidepathPoint[];
  threads: ThreadData[];
}

interface MilestoneData {
  id: number;
  title: string;
  target: string | null;
  timeframe: string | null;
  status: string | null;
  movedCount: number | null;
  steps: { id: number; weekNumber: number; description: string; status: string | null }[];
}

interface GlidepathPoint {
  id: number;
  date: string;
  plannedValue: number | null;
  actualValue: number | null;
  metric: string;
}

interface ThreadData {
  id: number;
  topic: string;
  title: string;
  status: string | null;
  lastMessageAt: string | null;
}

interface CoachMessage {
  id: number;
  role: string;
  content: string;
  metadata?: string | null;
  createdAt: string | null;
}

const TOPIC_ICONS: Record<string, typeof Target> = {
  weight: TrendingDown,
  pain: Heart,
  sleep: Moon,
  stress: Brain,
  nutrition: Target,
  fitness: Dumbbell,
  general: MessageCircle,
  goal_adjustment: Settings2,
};

const ADJUSTMENT_REASONS = [
  { key: "sick", label: "Feeling unwell", icon: Thermometer },
  { key: "travel", label: "Traveling", icon: Plane },
  { key: "injury", label: "Injury", icon: AlertTriangle },
  { key: "plateau", label: "Hit a plateau", icon: TrendingUp },
  { key: "motivation", label: "Low motivation", icon: Brain },
  { key: "life_event", label: "Life event", icon: Flag },
];

export default function GoalTracking() {
  const authFetch = useAuthFetch();
  const [, setLocation] = useLocation();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<GoalData | null>(null);
  const [showCoach, setShowCoach] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [coachThread, setCoachThread] = useState<ThreadData | null>(null);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachSending, setCoachSending] = useState(false);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustContext, setAdjustContext] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await authFetch("GET", "/api/goals/tracking");
      const data = await res.json();
      setGoals(data.goals || []);
      if (data.goals?.length > 0 && !selectedGoal) {
        setSelectedGoal(data.goals[0]);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [authFetch, selectedGoal]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages]);

  // Open coaching thread for a topic
  const openCoachThread = async (topic: string, goalId?: number) => {
    try {
      const res = await authFetch("POST", "/api/coaching/threads", { topic, goalId });
      const { thread } = await res.json();
      setCoachThread(thread);
      // Load messages
      const msgRes = await authFetch("GET", `/api/coaching/threads/${thread.id}/messages`);
      const { messages } = await msgRes.json();
      setCoachMessages(messages || []);
      setShowCoach(true);
    } catch (err) {
      console.error("Failed to open coaching thread:", err);
    }
  };

  // Send message in coaching thread
  const sendCoachMessage = async () => {
    if (!coachInput.trim() || !coachThread || coachSending) return;
    const msg = coachInput.trim();
    setCoachInput("");
    setCoachSending(true);

    // Optimistic update
    setCoachMessages(prev => [...prev, {
      id: Date.now(), role: "user", content: msg, createdAt: new Date().toISOString(),
    }]);

    try {
      const res = await authFetch("POST", `/api/coaching/threads/${coachThread.id}/message`, { message: msg });
      const { reply } = await res.json();
      setCoachMessages(prev => [...prev, reply]);
    } catch {
      setCoachMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant", content: "Sorry, I could not respond right now. Please try again.", createdAt: new Date().toISOString(),
      }]);
    } finally {
      setCoachSending(false);
    }
  };

  // Request goal adjustment
  const requestAdjustment = async () => {
    if (!selectedGoal || !adjustReason || adjusting) return;
    setAdjusting(true);
    try {
      const res = await authFetch("POST", `/api/coaching/adjust-goal/${selectedGoal.id}`, {
        reason: adjustReason,
        context: adjustContext,
      });
      const { thread, reply } = await res.json();
      setCoachThread(thread);
      setCoachMessages([reply]);
      setShowAdjust(false);
      setShowCoach(true);
      setAdjustReason("");
      setAdjustContext("");
    } catch (err) {
      console.error("Failed to request adjustment:", err);
    } finally {
      setAdjusting(false);
    }
  };

  // Glidepath chart (SVG)
  const renderGlidepath = (goal: GoalData) => {
    const points = goal.glidepath;
    if (points.length < 2) return null;

    const W = 560, H = 200, PAD = 40;
    const chartW = W - PAD * 2, chartH = H - PAD * 2;

    const allVals = points.flatMap(p => [p.plannedValue, p.actualValue].filter(v => v != null) as number[]);
    if (allVals.length === 0) return null;
    const minV = Math.min(...allVals) - 2;
    const maxV = Math.max(...allVals) + 2;
    const rangeV = maxV - minV || 1;

    const toX = (i: number) => PAD + (i / (points.length - 1)) * chartW;
    const toY = (v: number) => PAD + (1 - (v - minV) / rangeV) * chartH;

    // Planned line
    const plannedPath = points
      .filter(p => p.plannedValue != null)
      .map((p, i, arr) => {
        const idx = points.indexOf(p);
        const x = toX(idx);
        const y = toY(p.plannedValue!);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(" ");

    // Actual line
    const actualPoints = points.filter(p => p.actualValue != null);
    const actualPath = actualPoints
      .map((p, i) => {
        const idx = points.indexOf(p);
        const x = toX(idx);
        const y = toY(p.actualValue!);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(" ");

    // Month labels
    const months = points.filter((_, i) => i % 4 === 0);

    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={PAD} y1={PAD + f * chartH} x2={W - PAD} y2={PAD + f * chartH}
            stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map(f => {
          const v = maxV - f * rangeV;
          return (
            <text key={f} x={PAD - 8} y={PAD + f * chartH + 4}
              fill="hsl(var(--text-mid))" fontSize="10" textAnchor="end">
              {Math.round(v)}
            </text>
          );
        })}

        {/* X-axis labels */}
        {months.map((p) => {
          const idx = points.indexOf(p);
          const d = new Date(p.date);
          return (
            <text key={p.id} x={toX(idx)} y={H - 8}
              fill="hsl(var(--text-mid))" fontSize="9" textAnchor="middle">
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          );
        })}

        {/* Planned line (dashed) */}
        {plannedPath && (
          <path d={plannedPath} fill="none" stroke="hsl(var(--text-mid))"
            strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
        )}

        {/* Actual line (solid primary) */}
        {actualPath && (
          <path d={actualPath} fill="none" stroke="hsl(var(--primary))"
            strokeWidth="2.5" strokeLinecap="round" />
        )}

        {/* Actual dots */}
        {actualPoints.map(p => {
          const idx = points.indexOf(p);
          return (
            <circle key={`dot-${p.id}`} cx={toX(idx)} cy={toY(p.actualValue!)}
              r="4" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5" />
          );
        })}

        {/* Target line */}
        {goal.targetValue && (
          <>
            <line x1={PAD} y1={toY(parseFloat(goal.targetValue))} x2={W - PAD} y2={toY(parseFloat(goal.targetValue))}
              stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
            <text x={W - PAD + 4} y={toY(parseFloat(goal.targetValue)) + 3}
              fill="hsl(var(--primary))" fontSize="9" fontWeight="600">
              {goal.targetValue}
            </text>
          </>
        )}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setLocation("/")} className="p-1" data-testid="back-btn">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold text-foreground">Goal Tracking</h1>
          <p className="text-xs text-text-mid">{goals.length} active goal{goals.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-4 py-5 space-y-5">
        {goals.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Target className="w-10 h-10 text-text-mid mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">No goals set yet</p>
            <p className="text-xs text-text-mid mb-4">Complete onboarding to set your health goals</p>
            <button onClick={() => setLocation("/onboarding-chat")}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
              data-testid="start-onboarding-btn">
              Start Onboarding
            </button>
          </div>
        ) : (
          <>
            {/* Goal tabs */}
            {goals.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {goals.map(g => (
                  <button key={g.id}
                    onClick={() => setSelectedGoal(g)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      selectedGoal?.id === g.id
                        ? "bg-primary text-white"
                        : "bg-card border border-border text-text-mid"
                    }`}
                    data-testid={`goal-tab-${g.id}`}>
                    {g.goalType}
                  </button>
                ))}
              </div>
            )}

            {selectedGoal && (
              <>
                {/* Goal header card */}
                <div className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{selectedGoal.goalType}</h2>
                      {selectedGoal.customDescription && (
                        <p className="text-xs text-text-mid mt-0.5">{selectedGoal.customDescription}</p>
                      )}
                    </div>
                    <button onClick={() => setShowAdjust(true)}
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      data-testid="adjust-goal-btn">
                      <Settings2 className="w-4 h-4 text-text-mid" />
                    </button>
                  </div>

                  <div className="flex gap-4 text-xs">
                    {selectedGoal.targetValue && (
                      <div>
                        <p className="text-text-mid">Target</p>
                        <p className="font-semibold text-foreground">{selectedGoal.targetValue}</p>
                      </div>
                    )}
                    {selectedGoal.targetTimeline && (
                      <div>
                        <p className="text-text-mid">Timeline</p>
                        <p className="font-semibold text-foreground">{selectedGoal.targetTimeline}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-text-mid">Milestones</p>
                      <p className="font-semibold text-foreground">
                        {selectedGoal.milestones.filter(m => m.status === "completed").length}/{selectedGoal.milestones.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Glidepath chart */}
                {selectedGoal.glidepath.length > 1 && (
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground">Progress Glidepath</p>
                      <div className="flex items-center gap-3 text-[10px] text-text-mid">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-0.5 bg-text-mid opacity-50" style={{ borderTop: "1.5px dashed" }} /> Planned
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-0.5 bg-primary rounded" /> Actual
                        </span>
                      </div>
                    </div>
                    {renderGlidepath(selectedGoal)}
                  </div>
                )}

                {/* Milestones timeline */}
                {selectedGoal.milestones.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Flag className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Milestones</h3>
                    </div>
                    <div className="space-y-3">
                      {selectedGoal.milestones.map((m, i) => (
                        <button key={m.id}
                          onClick={() => setLocation(`/milestone/${m.id}`)}
                          className="w-full glass-card p-4 text-left transition-transform active:scale-[0.99]"
                          data-testid={`milestone-${m.id}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              m.status === "completed" ? "bg-primary text-white" :
                              m.status === "active" ? "bg-primary/10 text-primary" :
                              m.status === "paused" ? "bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" :
                              "bg-muted text-text-mid"
                            }`}>
                              {m.status === "completed" ? <Check className="w-4 h-4" /> :
                               m.status === "paused" ? <Pause className="w-3.5 h-3.5" /> :
                               <span className="text-xs font-bold">{i + 1}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{m.title}</p>
                              <p className="text-xs text-text-mid mt-0.5">
                                {m.target && `Target: ${m.target}`}
                                {m.target && m.timeframe && " -- "}
                                {m.timeframe}
                              </p>
                              {m.steps?.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {m.steps.map(s => (
                                    <div key={s.id} className={`h-1.5 flex-1 rounded-full ${
                                      s.status === "done" ? "bg-primary" :
                                      s.status === "skipped" ? "bg-[hsl(var(--gold))]/40" :
                                      "bg-muted"
                                    }`} />
                                  ))}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-mid shrink-0 mt-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coaching threads */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Coaching</h3>
                    </div>
                    <button onClick={() => openCoachThread(selectedGoal.goalType.toLowerCase().replace(/ /g, "_"), selectedGoal.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                      data-testid="new-coach-thread-btn">
                      <Plus className="w-3.5 h-3.5" /> Chat with Coach
                    </button>
                  </div>

                  {selectedGoal.threads.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGoal.threads.map(t => {
                        const Icon = TOPIC_ICONS[t.topic] || MessageCircle;
                        return (
                          <button key={t.id}
                            onClick={() => openCoachThread(t.topic, selectedGoal.id)}
                            className="w-full glass-card p-3 text-left flex items-center gap-3"
                            data-testid={`thread-${t.id}`}>
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{t.title}</p>
                              {t.lastMessageAt && (
                                <p className="text-xs text-text-mid">
                                  {new Date(t.lastMessageAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-mid shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="glass-card p-4 text-center">
                      <p className="text-xs text-text-mid">No coaching conversations yet. Start one to get personalized guidance.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Coach chat overlay */}
      {showCoach && coachThread && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col" data-testid="coach-overlay">
          {/* Header */}
          <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 safe-top">
            <button onClick={() => setShowCoach(false)} className="p-1" data-testid="close-coach">
              <X className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{coachThread.title}</p>
              <p className="text-xs text-text-mid">AI Wellness Coach</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-background px-4 py-4 space-y-3">
            {coachMessages.filter(m => m.role !== "system").map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: m.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br/>")
                  }} />
                </div>
              </div>
            ))}
            {coachSending && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-text-mid animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-text-mid animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-text-mid animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="bg-card border-t border-border px-4 py-3 safe-bottom">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={coachInput}
                onChange={e => setCoachInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendCoachMessage()}
                placeholder="Message your coach..."
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-text-mid outline-none focus:border-primary transition-colors"
                data-testid="coach-input"
              />
              <button onClick={sendCoachMessage}
                disabled={!coachInput.trim() || coachSending}
                className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-40 transition-opacity"
                data-testid="coach-send">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment modal */}
      {showAdjust && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" data-testid="adjust-overlay">
          <div className="bg-card rounded-t-2xl w-full max-w-[560px] max-h-[80vh] overflow-y-auto p-5 safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Adjust Goal</h3>
              <button onClick={() => setShowAdjust(false)} className="p-1">
                <X className="w-5 h-5 text-text-mid" />
              </button>
            </div>

            <p className="text-xs text-text-mid mb-4">
              Before making changes, let's have a quick conversation with your coach to find the best path forward.
            </p>

            <p className="text-xs font-semibold text-foreground mb-2">What's going on?</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ADJUSTMENT_REASONS.map(r => {
                const Icon = r.icon;
                return (
                  <button key={r.key}
                    onClick={() => setAdjustReason(r.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      adjustReason === r.key
                        ? "bg-primary text-white"
                        : "bg-muted text-text-mid hover:bg-muted/80"
                    }`}
                    data-testid={`reason-${r.key}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {r.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-foreground mb-2">Tell me more (optional)</p>
            <textarea
              value={adjustContext}
              onChange={e => setAdjustContext(e.target.value)}
              placeholder="Any additional context..."
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-text-mid outline-none focus:border-primary resize-none h-20 mb-4"
              data-testid="adjust-context"
            />

            <button onClick={requestAdjustment}
              disabled={!adjustReason || adjusting}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              data-testid="start-adjustment-btn">
              {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Talk to Coach
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
