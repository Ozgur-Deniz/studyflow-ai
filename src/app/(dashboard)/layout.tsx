"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { DashboardHeader } from "../../components/layout/DashboardHeader";
import { DashboardUserProvider } from "../../components/layout/DashboardUserContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [userAvatarId, setUserAvatarId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUserName(data.user.name);
          setUserInitial(data.user.name?.charAt(0)?.toUpperCase() || "U");
          setUserAvatarId(
            typeof data.user.avatarId === "string" ? data.user.avatarId : null,
          );
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
    <DashboardUserProvider userName={userName}>
      <div className="flex h-screen bg-[#f5f7fa]">
        <Sidebar
          userName={userName}
          userInitial={userInitial}
          userAvatarId={userAvatarId}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <DashboardHeader
            onMenuClick={() => setIsMobileSidebarOpen((current) => !current)}
          />
          <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
        </main>
      </div>
    </DashboardUserProvider>
  );
}
