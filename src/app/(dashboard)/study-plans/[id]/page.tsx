"use client";

import { useState, useEffect, use, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  CheckCircle,
  Check,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isCompleted: boolean;
}

const extractGuideItems = (description: string | null | undefined) => {
  if (!description) {
    return [];
  }

  const lines = description
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-*]\s*/, "")
        .replace(/\*\*/g, "")
        .trim(),
    )
    .filter(Boolean);

  const dayItems = lines.filter((line) => {
    return /^(day\s*\d+|\d+\s*\.?\s*(day|gün)|gün\s*\d+|week\s*\d+|\d+\s*\.?\s*week)\b/i.test(
      line,
    );
  });

  const fallbackItems =
    dayItems.length > 0
      ? dayItems
      : lines
          .filter((line) => /^[A-Z0-9].{4,80}$/.test(line))
          .slice(0, 8);

  return fallbackItems.map((title, index) => ({
    id: `${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title,
  }));
};

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-8 border-b border-[#e2e8f0] pb-3 text-2xl font-black tracking-tight text-[#0f172a] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 flex items-center gap-2 text-xl font-black tracking-tight text-[#0f172a] first:mt-0">
      <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-base font-extrabold text-[#1e293b] first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-[15px] font-medium leading-7 text-[#334155] last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-5 list-disc space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 pl-8 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 list-decimal space-y-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 pl-8 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 text-[14px] font-medium leading-6 text-[#334155]">
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-extrabold text-[#0f172a]">{children}</strong>
  ),
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-[#e2e8f0]">
      <table className="min-w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 font-extrabold text-[#0f172a]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[#e2e8f0] px-4 py-3 text-[#334155]">
      {children}
    </td>
  ),
};

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [completedGuideItemIds, setCompletedGuideItemIds] = useState<string[]>(
    [],
  );
  const hasLoadedGuideProgressRef = useRef(false);

  const resolvedParams = use(params);
  const planId = resolvedParams.id;
  const guideItems = useMemo(
    () => extractGuideItems(plan?.description),
    [plan?.description],
  );
  const completedGuideCount = guideItems.filter((item) =>
    completedGuideItemIds.includes(item.id),
  ).length;

  useEffect(() => {
    const fetchPlanDetail = async () => {
      try {
        const res = await fetch(`/api/study-plans/${planId}`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
        } else {
          router.push("/study-plans");
        }
      } catch (error) {
        console.error("Failed to fetch plan detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanDetail();
  }, [planId, router]);

  useEffect(() => {
    hasLoadedGuideProgressRef.current = false;

    queueMicrotask(() => {
      try {
        const savedProgress = window.localStorage.getItem(
          `study-plan-guide:${planId}`,
        );
        const parsedProgress = savedProgress
          ? (JSON.parse(savedProgress) as unknown)
          : [];

        setCompletedGuideItemIds(
          Array.isArray(parsedProgress)
            ? parsedProgress.filter((value): value is string => {
                return typeof value === "string";
              })
            : [],
        );
      } catch (error) {
        console.error("Failed to load study plan guide progress:", error);
        setCompletedGuideItemIds([]);
      } finally {
        hasLoadedGuideProgressRef.current = true;
      }
    });
  }, [planId]);

  useEffect(() => {
    if (!hasLoadedGuideProgressRef.current) {
      return;
    }

    window.localStorage.setItem(
      `study-plan-guide:${planId}`,
      JSON.stringify(completedGuideItemIds),
    );
  }, [completedGuideItemIds, planId]);

  const handleToggleGuideItem = (itemId: string) => {
    setCompletedGuideItemIds((currentIds) =>
      currentIds.includes(itemId)
        ? currentIds.filter((currentId) => currentId !== itemId)
        : [...currentIds, itemId],
    );
  };

  const handleTogglePlanStatus = async () => {
    if (!plan || isUpdating) return;

    const nextIsCompleted = !plan.isCompleted;

    if (
      nextIsCompleted &&
      guideItems.length > 0 &&
      completedGuideCount < guideItems.length
    ) {
      toast.warning(
        `Complete all plan guide steps first (${completedGuideCount}/${guideItems.length}).`,
      );
      return;
    }

    setIsUpdating(true);

    try {
      const res = await fetch(`/api/study-plans/${planId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: nextIsCompleted,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { plan?: StudyPlan };
        setPlan((prev) =>
          data.plan ?? (prev ? { ...prev, isCompleted: nextIsCompleted } : null),
        );
      } else {
        alert("Failed to update plan status.");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <Link
        href="/study-plans"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#64748b] hover:text-[#6366f1] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
        Back to Study Plans
      </Link>

      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-[12px] font-bold text-[#6366f1]">
            <BookOpen className="w-3.5 h-3.5" /> AI Generated Roadmap
          </div>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight text-[#0f172a]">
            {plan.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[13px] font-bold text-[#64748b]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#94a3b8]" /> Created on{" "}
              {new Date(plan.createdAt).toLocaleDateString()}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
                plan.isCompleted
                  ? "bg-[#f0fdf4] text-[#16a34a]"
                  : "bg-[#f8fafc] text-[#64748b]"
              }`}
            >
              {plan.isCompleted ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Completed
                </>
              ) : (
                <>
                  <ListChecks className="h-3.5 w-3.5" /> In Progress
                </>
              )}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <button
            onClick={handleTogglePlanStatus}
            disabled={isUpdating}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-[14px] font-bold transition-all duration-300 ${
              plan.isCompleted
                ? "border border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a] hover:border-[#86efac] hover:bg-white"
                : "border border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:border-[#6366f1] hover:bg-[#eef2ff] hover:text-[#6366f1] active:scale-[0.98]"
            }`}
          >
            {isUpdating ? (
              "Updating..."
            ) : plan.isCompleted ? (
              <>
                <ListChecks className="w-4 h-4" /> Mark as In Progress
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Mark as Completed
              </>
            )}
          </button>
        </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="self-start rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#6366f1]">
            <ListChecks className="h-5 w-5" />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-[#0f172a]">
                Plan Guide
              </h2>
              <p className="mt-1 text-xs font-bold text-[#64748b]">
                {completedGuideCount} / {guideItems.length} completed
              </p>
            </div>
          </div>

          {guideItems.length === 0 ? (
            <p className="mt-4 text-sm font-medium leading-6 text-[#64748b]">
              The generated plan does not include day-based sections yet.
            </p>
          ) : (
            <div className="mt-5 space-y-2">
              {guideItems.map((item, index) => {
                const isItemCompleted = completedGuideItemIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggleGuideItem(item.id)}
                    className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      isItemCompleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[#e2e8f0] bg-[#f8fafc] text-[#334155] hover:border-[#c7d2fe] hover:bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        isItemCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-[#cbd5e1] bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-black uppercase tracking-wide text-[#94a3b8]">
                        Step {index + 1}
                      </span>
                      <span
                        className={`mt-0.5 block text-sm font-extrabold leading-5 ${
                          isItemCompleted ? "line-through" : ""
                        }`}
                      >
                        {item.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm md:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {plan.description}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
