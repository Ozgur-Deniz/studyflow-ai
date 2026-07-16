import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Sparkles,
  Target,
} from "lucide-react";

type RecommendationStats = {
  activeStudyPlans: number;
  aiConversations: number;
  flashcardDecks: number;
  quizzesSolved: number;
};

type FocusBrief = {
  priority: string;
  reason: string;
  sequence: string[];
  status: Array<{
    label: string;
    value: string;
    tone: string;
  }>;
};

const stepAccentClasses = [
  "bg-green-200",
  "bg-green-400",
  "bg-green-800",
];

function buildFocusBrief(stats: RecommendationStats): FocusBrief {
  const needsPlan = stats.activeStudyPlans === 0;
  const needsRecall = stats.flashcardDecks === 0;
  const needsCheck = stats.quizzesSolved === 0;
  const needsAssistant = stats.aiConversations === 0;

  if (needsPlan) {
    return {
      priority: "Define the next target before practicing",
      reason:
        "A study plan gives the rest of the workspace a clear topic and keeps practice from becoming random.",
      sequence: [
        "Create one focused study plan",
        "Generate flashcards from the plan topic",
        "Run one short quiz after review",
      ],
      status: [
        { label: "Plan", value: "Missing", tone: "text-rose-600 bg-rose-50" },
        {
          label: "Practice",
          value: "Not started",
          tone: "text-slate-600 bg-slate-100",
        },
      ],
    };
  }

  if (needsRecall) {
    return {
      priority: "Add active recall to your plan",
      reason:
        "You have a direction, but flashcards will make the material easier to retain between sessions.",
      sequence: [
        "Generate one deck from your active plan",
        "Review 10-15 cards",
        "Use missed ideas as quiz topics",
      ],
      status: [
        { label: "Plan", value: "Ready", tone: "text-emerald-700 bg-emerald-50" },
        { label: "Recall", value: "Missing", tone: "text-amber-700 bg-amber-50" },
      ],
    };
  }

  if (needsCheck) {
    return {
      priority: "Validate what you remember",
      reason:
        "A quiz will show what is actually stable after planning and flashcard review.",
      sequence: [
        "Review your newest deck",
        "Take one short quiz",
        "Ask AI to explain missed concepts",
      ],
      status: [
        { label: "Recall", value: "Ready", tone: "text-emerald-700 bg-emerald-50" },
        { label: "Quiz", value: "Missing", tone: "text-amber-700 bg-amber-50" },
      ],
    };
  }

  if (needsAssistant) {
    return {
      priority: "Use AI for the next study decision",
      reason:
        "You have core materials. The assistant can turn your progress into a tighter next session.",
      sequence: [
        "Ask what to study next",
        "Request a weak-spot summary",
        "Convert the answer into one action",
      ],
      status: [
        { label: "Materials", value: "Ready", tone: "text-emerald-700 bg-emerald-50" },
        { label: "AI", value: "Unused", tone: "text-green-800 bg-green-50" },
      ],
    };
  }

  return {
    priority: "Keep the loop small and consistent",
    reason:
      "Your workspace has plans, recall, quizzes, and AI context. The next gain comes from a short repeatable routine.",
    sequence: [
      "Review one flashcard deck",
      "Solve one quiz",
      "Finish one focused timer block",
    ],
    status: [
      { label: "System", value: "Ready", tone: "text-emerald-700 bg-emerald-50" },
      { label: "Next", value: "Review", tone: "text-emerald-800 bg-emerald-50" },
    ],
  };
}

export function AIRecommendationCard({
  stats,
  isLoading = false,
}: {
  stats: RecommendationStats;
  isLoading?: boolean;
}) {
  const brief = buildFocusBrief(stats);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_12%_20%,rgba(10,159,67,0.14),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(20,184,166,0.12),transparent_26%),linear-gradient(135deg,#ffffff_0%,#f8fafc_58%,#ecfdf3_100%)] p-5 shadow-soft sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,159,67,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(10,159,67,0.07) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.78)_42%,transparent_58%)] bg-[length:220%_100%] opacity-50 animate-shimmer" />
      <div className="pointer-events-none absolute inset-x-6 top-5 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-10 bottom-5 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 animate-float rounded-full bg-emerald-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-20 h-56 w-56 animate-float-slow rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-20 w-20 animate-pulse rounded-full bg-green-200/30 blur-2xl" />

      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 rounded-2xl border border-white/80 bg-white/74 p-5 shadow-soft-sm backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Focus Brief
              </div>
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-950">
                {isLoading ? "Reading your workspace..." : brief.priority}
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] font-medium leading-6 text-slate-500">
                {brief.reason}
              </p>
            </div>

            <Link
              href="/ai-assistant"
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-emerald-100 bg-white px-4 text-[13px] font-medium text-emerald-700 shadow-soft-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-soft focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              Ask AI
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-3">
            {brief.sequence.map((item, index) => (
              <div
                key={item}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/82 px-3.5 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-white hover:shadow-soft-sm"
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${
                    stepAccentClasses[index] ?? "bg-green-400"
                  }`}
                />
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[12px] font-semibold text-white shadow-soft-sm transition group-hover:scale-105 group-hover:bg-emerald-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 text-[13px] font-medium leading-5 text-slate-700">
                      {item}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/74 p-5 shadow-soft-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-600">
                Workspace State
              </p>
              <p className="mt-1 text-[18px] font-semibold text-slate-950">
                {isLoading ? "Syncing..." : "Next action ready"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft-sm">
              <Target className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {brief.status.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl px-3 py-2.5 ${item.tone}`}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] opacity-70">
                  {item.label}
                </p>
                <p className="mt-1 text-[14px] font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
              <Clock3 className="h-4 w-4 text-emerald-500" />
              Suggested session: 30 minutes
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              One clear task beats another menu choice
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
              <MessageSquareText className="h-4 w-4 text-green-500" />
              Ask AI only when the next step is unclear
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
