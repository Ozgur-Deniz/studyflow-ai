"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");

        if (response.ok) {
          const data = await response.json();
          setUserName(data.user.name);
        } else {
          console.warn(
            `[Auth] Session fetch failed with status: ${response.status}`,
          );
        }
      } catch (error) {
        console.error("[Auth] Session fetch error:", error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchSession();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      } else {
        console.error("[Auth] Server rejected the logout request.");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center border border-gray-100 dark:border-gray-700">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          👋
        </div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          {isLoadingSession
            ? "Loading..."
            : `Welcome, ${userName.toUpperCase()}!`}
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
          You have successfully passed the firewall and are in the protected
          area. This will be the heart of the application.
        </p>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-semibold py-3 px-8 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
