import { Trophy } from "lucide-react";

export function AchievementsCard() {
  const achievements = [
    {
      name: "First Login",
      desc: "Welcome to StudyFlow!",
      progress: 100,
      color: "from-[#6366f1] to-[#8b5cf6]",
      emoji: "🎉",
    },
    {
      name: "Create a Plan",
      desc: "Set up your first study plan",
      progress: 0,
      color: "from-[#06b6d4] to-[#0891b2]",
      emoji: "📚",
    },
    {
      name: "Study Streak",
      desc: "Study 7 days in a row",
      progress: 0,
      color: "from-[#f43f5e] to-[#e11d48]",
      emoji: "🔥",
    },
  ];

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-[#e2e8f0] animate-scale-in relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#fef3c7] to-transparent rounded-bl-full opacity-50" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[16px] font-bold text-[#0f172a]">
            Achievements
          </h3>
          <Trophy size={20} className="text-[#f59e0b] animate-bounce-in" />
        </div>

        <div className="space-y-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.name}
              className="group flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8fafc] transition-all duration-200"
            >
              <span className="text-xl group-hover:scale-125 transition-transform duration-300">
                {achievement.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#0f172a]">
                  {achievement.name}
                </p>
                <p className="text-[11px] text-[#94a3b8]">
                  {achievement.desc}
                </p>
                <div className="mt-1.5 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${achievement.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#94a3b8]">
                {achievement.progress}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
