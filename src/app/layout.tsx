import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StudyFlow AI | Premium Study Workspace",
    template: "%s | StudyFlow AI",
  },
  description:
    "A calm, premium AI study workspace for planning, practice, flashcards, quizzes, and focused learning.",
  applicationName: "StudyFlow AI",
  authors: [{ name: "StudyFlow AI" }],
  keywords: [
    "AI study planner",
    "study plans",
    "flashcards",
    "quizzes",
    "learning dashboard",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f7fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-background antialiased">
      <body className="min-h-full bg-background font-sans text-foreground selection:bg-primary/15">
        {children}
      </body>
    </html>
  );
}
