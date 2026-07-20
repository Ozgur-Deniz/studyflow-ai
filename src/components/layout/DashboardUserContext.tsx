"use client";

import { createContext, useContext } from "react";

type DashboardUserContextValue = {
  userName: string;
};

const DashboardUserContext = createContext<DashboardUserContextValue>({
  userName: "",
});

export function DashboardUserProvider({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <DashboardUserContext.Provider value={{ userName }}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser(): DashboardUserContextValue {
  return useContext(DashboardUserContext);
}
