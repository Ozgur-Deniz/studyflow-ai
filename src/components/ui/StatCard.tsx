import Link from "next/link";
import { LucideIcon, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  shadowColor: string;
  href?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  iconBg,
  shadowColor,
  href,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300`}
        >
          <div
            className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-sm`}
          >
            <Icon size={16} className="text-white" />
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-[#10b981] bg-[#ecfdf5] px-2.5 py-1 rounded-full">
          <TrendingUp size={12} />
          {change}
        </span>
      </div>
      <p className="text-[28px] font-extrabold text-[#0f172a] leading-none mb-1 tracking-tight">
        {value}
      </p>
      <p className="text-[12px] text-[#94a3b8] font-semibold uppercase tracking-wider">
        {title}
      </p>
    </>
  );

  const className = `bg-white p-5 rounded-2xl border border-[#e2e8f0] card-hover group ${shadowColor} ${
    href ? "cursor-pointer" : "cursor-default"
  }`;

  if (href) {
    return (
      <Link href={href} className={`block ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
