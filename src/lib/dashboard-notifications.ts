"use client";

import { toast } from "react-toastify";

export const DASHBOARD_NOTIFICATIONS_REFRESH_EVENT =
  "studyflow:notifications-refresh";
export const DASHBOARD_ACTIVITY_REFRESH_EVENT =
  "studyflow:activity-refresh";
export const DASHBOARD_ACTIVITY_STORAGE_KEY =
  "studyflow.activity.lastUpdatedAt";

type CreatedResource = "study-plan" | "flashcard" | "quiz";

const CREATED_RESOURCE_MESSAGES: Record<CreatedResource, string> = {
  "study-plan": "Study plan created",
  flashcard: "Flashcards created",
  quiz: "Quiz created",
};

export function notifyResourceCreated(
  resource: CreatedResource,
  resourceId?: string,
) {
  toast.success(CREATED_RESOURCE_MESSAGES[resource], {
    toastId: resourceId ? `${resource}-created-${resourceId}` : undefined,
  });

  window.dispatchEvent(new Event(DASHBOARD_NOTIFICATIONS_REFRESH_EVENT));
  refreshDashboardActivity();
}

export function refreshDashboardNotifications() {
  window.dispatchEvent(new Event(DASHBOARD_NOTIFICATIONS_REFRESH_EVENT));
}

export function refreshDashboardActivity() {
  window.dispatchEvent(new Event(DASHBOARD_ACTIVITY_REFRESH_EVENT));

  try {
    window.localStorage.setItem(
      DASHBOARD_ACTIVITY_STORAGE_KEY,
      new Date().toISOString(),
    );
  } catch {
    // The same-tab event still keeps the active dashboard in sync.
  }
}
