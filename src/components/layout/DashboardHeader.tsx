"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Layers,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DASHBOARD_NOTIFICATIONS_REFRESH_EVENT } from "@/lib/dashboard-notifications";

type ActivePanel = "search" | "create" | "notifications" | null;
type SearchResultType =
  | "study-plan"
  | "flashcard"
  | "quiz"
  | "conversation";

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  detail: string;
  href: string;
  updatedAt: string;
};

type ActivityNotification = {
  id: string;
  kind: "study-plan" | "flashcard" | "quiz" | "activity";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
};

const LAST_SEEN_NOTIFICATIONS_KEY = "studyflow.notifications.lastSeenAt";

const resultTypeMeta = {
  "study-plan": {
    label: "Study plan",
    icon: BookOpen,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
  flashcard: {
    label: "Flashcards",
    icon: Layers,
    iconClassName: "bg-amber-50 text-amber-700",
  },
  quiz: {
    label: "Quiz",
    icon: ClipboardList,
    iconClassName: "bg-sky-50 text-sky-700",
  },
  conversation: {
    label: "AI conversation",
    icon: MessageSquare,
    iconClassName: "bg-emerald-50 text-emerald-700",
  },
} satisfies Record<
  SearchResultType,
  { label: string; icon: typeof BookOpen; iconClassName: string }
>;

const quickCreateItems = [
  {
    label: "Study plan",
    detail: "Generate an AI learning roadmap",
    href: "/study-plans#generate-plan",
    icon: BookOpen,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    label: "Flashcard deck",
    detail: "Create cards for a topic",
    href: "/flashcards?autoGenerate=true",
    icon: Layers,
    iconClassName: "bg-amber-50 text-amber-700",
  },
  {
    label: "Quiz",
    detail: "Generate a practice quiz",
    href: "/quizzes?autoGenerate=true",
    icon: ClipboardList,
    iconClassName: "bg-sky-50 text-sky-700",
  },
];

const notificationKindMeta = {
  "study-plan": {
    icon: BookOpen,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
  flashcard: {
    icon: Layers,
    iconClassName: "bg-amber-50 text-amber-700",
  },
  quiz: {
    icon: ClipboardList,
    iconClassName: "bg-sky-50 text-sky-700",
  },
  activity: {
    icon: CheckCircle2,
    iconClassName: "bg-[#ecfdf3] text-[#087b36]",
  },
} satisfies Record<
  ActivityNotification["kind"],
  { icon: typeof BookOpen; iconClassName: string }
>;

function formatRelativeTime(value: string): string {
  const elapsedSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  );

  if (elapsedSeconds < 60) {
    return "Just now";
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const headerRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [notifications, setNotifications] = useState<ActivityNotification[]>(
    [],
  );
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const [lastSeenAt, setLastSeenAt] = useState(0);
  const normalizedQuery = query.trim();

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    setIsNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const response = await fetch("/api/dashboard/notifications", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error(`Notifications request failed: ${response.status}`);
      }

      const body = (await response.json()) as {
        notifications?: ActivityNotification[];
      };
      setNotifications(body.notifications ?? []);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("[Dashboard Header] Notifications failed:", error);
      setNotificationsError("Notifications could not be loaded.");
    } finally {
      if (!signal?.aborted) {
        setIsNotificationsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const storedLastSeenAt = window.localStorage.getItem(
      LAST_SEEN_NOTIFICATIONS_KEY,
    );
    const controller = new AbortController();
    const animationFrameId = window.requestAnimationFrame(() => {
      setLastSeenAt(storedLastSeenAt ? Date.parse(storedLastSeenAt) || 0 : 0);
      void loadNotifications(controller.signal);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      controller.abort();
    };
  }, [loadNotifications]);

  useEffect(() => {
    const handleNotificationsRefresh = () => {
      void loadNotifications();
    };

    window.addEventListener(
      DASHBOARD_NOTIFICATIONS_REFRESH_EVENT,
      handleNotificationsRefresh,
    );

    return () => {
      window.removeEventListener(
        DASHBOARD_NOTIFICATIONS_REFRESH_EVENT,
        handleNotificationsRefresh,
      );
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/dashboard/search?q=${encodeURIComponent(normalizedQuery)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`);
        }

        const body = (await response.json()) as { results?: SearchResult[] };
        setSearchResults(body.results ?? []);
        setActiveResultIndex(0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("[Dashboard Header] Search failed:", error);
        setSearchResults([]);
        setSearchError("Search could not be completed.");
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [normalizedQuery]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActivePanel("search");
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === "Escape") {
        setActivePanel(null);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (activePanel !== "notifications" || notifications.length === 0) {
      return;
    }

    const newestTimestamp = notifications[0].createdAt;
    window.localStorage.setItem(
      LAST_SEEN_NOTIFICATIONS_KEY,
      newestTimestamp,
    );
    const animationFrameId = window.requestAnimationFrame(() => {
      setLastSeenAt(new Date(newestTimestamp).getTime());
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [activePanel, notifications]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          new Date(notification.createdAt).getTime() > lastSeenAt,
      ).length,
    [lastSeenAt, notifications],
  );

  const navigateToSearchResult = (result: SearchResult) => {
    setActivePanel(null);
    setQuery("");
    router.push(result.href);
  };

  const toggleNotifications = () => {
    const isOpening = activePanel !== "notifications";

    if (isOpening) {
      void loadNotifications();
    }

    setActivePanel(isOpening ? "notifications" : null);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (searchResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex(
        (currentIndex) => (currentIndex + 1) % searchResults.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex(
        (currentIndex) =>
          (currentIndex - 1 + searchResults.length) % searchResults.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      navigateToSearchResult(searchResults[activeResultIndex]);
    }
  };

  const showSearchPanel =
    activePanel === "search" && normalizedQuery.length >= 2;

  return (
    <header
      ref={headerRef}
      className="relative z-40 h-16 shrink-0 animate-fade-in border-b border-[#e2e8f0] bg-white/95 px-4 backdrop-blur-xl md:h-[76px] md:px-6 lg:px-8"
    >
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-3 lg:gap-5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          title="Menu"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#dbe2ea] bg-white text-[#64748b] transition-colors duration-200 hover:border-[#bbf7d0] hover:bg-[#f8fafc] hover:text-[#087b36] focus:outline-none focus:ring-4 focus:ring-[#22c55e]/10 md:hidden"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="group relative min-w-0 flex-1 lg:max-w-[760px]">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] transition-colors duration-200 group-focus-within:text-[#0a9f43]"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);

              if (nextQuery.trim().length < 2) {
                setSearchResults([]);
                setSearchError(null);
                setIsSearchLoading(false);
                setActiveResultIndex(0);
              }

              setActivePanel("search");
            }}
            onFocus={() => setActivePanel("search")}
            onKeyDown={handleSearchKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-label="Search your study workspace"
            aria-expanded={showSearchPanel}
            aria-controls="dashboard-search-results"
            placeholder="Search plans, flashcards, quizzes, conversations..."
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-[#dbe2ea] bg-[#f8fafc] pl-10 pr-3 text-[13px] font-medium text-[#0f172a] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[#94a3b8] focus:border-[#86efac] focus:bg-white focus:ring-4 focus:ring-[#22c55e]/10 sm:pr-[76px]"
          />
          <div className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
            <kbd className="flex h-6 min-w-6 items-center justify-center rounded-md border border-[#dbe2ea] bg-white px-1.5 text-[10px] font-semibold text-[#64748b] shadow-sm">
              Ctrl
            </kbd>
            <kbd className="flex h-6 min-w-6 items-center justify-center rounded-md border border-[#dbe2ea] bg-white px-1.5 text-[10px] font-semibold text-[#64748b] shadow-sm">
              K
            </kbd>
          </div>

          {showSearchPanel && (
            <div
              id="dashboard-search-results"
              className="absolute left-0 right-0 top-[calc(100%+10px)] overflow-hidden rounded-lg border border-[#dbe2ea] bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)]"
            >
              {isSearchLoading ? (
                <div className="flex h-24 items-center justify-center text-[#64748b]">
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span className="ml-2 text-[13px] font-medium">Searching...</span>
                </div>
              ) : searchError ? (
                <div className="px-4 py-5 text-center text-[13px] font-medium text-[#be123c]">
                  {searchError}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-5 text-center text-[13px] font-medium text-[#64748b]">
                  No matching items found.
                </div>
              ) : (
                <div className="max-h-[380px] overflow-y-auto p-1.5" role="listbox">
                  {searchResults.map((result, index) => {
                    const meta = resultTypeMeta[result.type];
                    const Icon = meta.icon;
                    const isActive = index === activeResultIndex;

                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveResultIndex(index)}
                        onClick={() => navigateToSearchResult(result)}
                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                          isActive ? "bg-[#f1f5f9]" : "hover:bg-[#f8fafc]"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${meta.iconClassName}`}
                        >
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-[#0f172a]">
                            {result.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] font-medium text-[#64748b]">
                            {meta.label} - {result.detail}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="relative">
            <button
              type="button"
              aria-label="Quick create"
              title="Quick create"
              aria-expanded={activePanel === "create"}
              onClick={() =>
                setActivePanel((currentPanel) =>
                  currentPanel === "create" ? null : "create",
                )
              }
              className="flex h-11 items-center gap-2 rounded-lg bg-[#0f172a] px-3 text-[12px] font-semibold text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.8)] transition-colors duration-200 hover:bg-[#1e293b] sm:px-3.5"
            >
              <Plus size={16} aria-hidden="true" />
              <span className="hidden xl:inline">Quick create</span>
              <ChevronDown
                size={14}
                className={`hidden text-[#94a3b8] transition-transform xl:block ${
                  activePanel === "create" ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {activePanel === "create" && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[300px] overflow-hidden rounded-lg border border-[#dbe2ea] bg-white p-1.5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)]">
                {quickCreateItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActivePanel(null)}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-[#f8fafc]"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${item.iconClassName}`}
                      >
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[#0f172a]">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-[#64748b]">
                          {item.detail}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mx-1 hidden h-7 w-px bg-[#e2e8f0] sm:block" />

          <div className="relative">
            <button
              type="button"
              aria-label="Open notifications"
              title="Notifications"
              aria-expanded={activePanel === "notifications"}
              onClick={toggleNotifications}
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-[#dbe2ea] bg-white text-[#64748b] transition-colors duration-200 hover:border-[#bbf7d0] hover:bg-[#f8fafc] hover:text-[#087b36]"
            >
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {activePanel === "notifications" && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-lg border border-[#dbe2ea] bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)]">
                <div className="flex h-12 items-center justify-between border-b border-[#e2e8f0] px-4">
                  <p className="text-[13px] font-semibold text-[#0f172a]">
                    Notifications
                  </p>
                  {notifications.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0a9f43]">
                      <CheckCircle2 size={13} aria-hidden="true" />
                      Read
                    </span>
                  )}
                </div>

                {isNotificationsLoading ? (
                  <div className="flex h-28 items-center justify-center text-[#64748b]">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  </div>
                ) : notificationsError ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-[12px] font-medium text-[#be123c]">
                      {notificationsError}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadNotifications()}
                      className="mt-3 text-[12px] font-semibold text-[#087b36] hover:text-[#065f2d]"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Bell className="mx-auto h-6 w-6 text-[#94a3b8]" aria-hidden="true" />
                    <p className="mt-2 text-[12px] font-medium text-[#64748b]">
                      No recent activity yet.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[390px] overflow-y-auto p-1.5">
                    {notifications.map((notification) => {
                      const meta = notificationKindMeta[notification.kind];
                      const Icon = meta.icon;

                      return (
                        <Link
                          key={notification.id}
                          href={notification.href}
                          onClick={() => setActivePanel(null)}
                          className="flex gap-3 rounded-md px-3 py-3 transition-colors hover:bg-[#f8fafc]"
                        >
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${meta.iconClassName}`}
                          >
                            <Icon size={16} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className="truncate text-[12px] font-semibold text-[#0f172a]">
                                {notification.title}
                              </span>
                              <span className="shrink-0 text-[10px] font-medium text-[#94a3b8]">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </span>
                            <span className="mt-1 block text-[11px] font-medium text-[#64748b]">
                              {notification.detail}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
