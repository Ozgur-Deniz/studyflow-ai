import Image from "next/image";

interface LogoProps {
  size?: "sm" | "lg";
}

export function Logo({ size = "sm" }: LogoProps) {
  const isLg = size === "lg";

  if (isLg) {
    return (
      <div className="relative h-72 w-72 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-emerald-950/15 ring-1 ring-white/70">
        <Image
          src="/logo.png"
          alt="StudyFlow AI"
          fill
          priority
          sizes="288px"
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2.5">
      <div
        aria-hidden="true"
        className="h-11 w-11 shrink-0 rounded-xl bg-white bg-no-repeat shadow-md shadow-emerald-200/70 ring-1 ring-emerald-100 transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundImage: "url('/logo.png')",
          backgroundPosition: "center -7px",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="min-w-0">
        <span className="flex items-center text-[24px] font-normal leading-tight tracking-normal">
          <span className="text-[#071a33]">Study</span>
          <span className="text-primary">Flow</span>
          <span className="ml-1.5 rounded-md bg-[#24d653] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#04351d]">
            AI
          </span>
        </span>
        <p className="-mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          Study smart
        </p>
      </div>
    </div>
  );
}
