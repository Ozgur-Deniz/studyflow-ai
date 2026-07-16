import { InputHTMLAttributes } from "react";
import { LucideIcon } from "lucide-react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  focusColor?: "indigo" | "purple";
}

export function InputField({
  id,
  label,
  icon: Icon,
  focusColor = "indigo",
  ...props
}: InputFieldProps) {
  const focusRingClass =
    focusColor === "indigo"
      ? "focus:ring-[#0a9f43]/15 focus:border-[#0a9f43] group-focus-within:text-[#0a9f43]"
      : "focus:ring-[#4ade80]/15 focus:border-[#4ade80] group-focus-within:text-[#4ade80]";

  return (
    <div>
      <label
        className="block text-[13px] font-bold text-[#374151] mb-2"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative group">
        <Icon
          size={18}
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] transition-colors duration-200 ${focusRingClass.split(" ")[2]}`}
          aria-hidden="true"
        />
        <input
          id={id}
          className={`w-full h-12 pl-11 pr-4 text-[14px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 text-[#0f172a] placeholder:text-[#64748b] transition-all duration-300 hover:border-[#cbd5e1] ${focusRingClass.split(" ")[0]} ${focusRingClass.split(" ")[1]}`}
          {...props}
        />
      </div>
    </div>
  );
}
