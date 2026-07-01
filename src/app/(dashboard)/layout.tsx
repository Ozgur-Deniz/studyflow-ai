"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { DashboardHeader } from "../../components/layout/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUserName(data.user.name);
          setUserInitial(data.user.name?.charAt(0)?.toUpperCase() || "U");
        }
      } catch (error) {
        console.error("[Layout] Session fetch error:", error);
      }
    };
    fetchSession();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
      } else {
        console.error("[Layout] Logout failed.");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("[Layout] Error during logout:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f7fa]">
      <Sidebar
        userName={userName}
        userInitial={userInitial}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userName={userName} userInitial={userInitial} />
        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
}
