import Link from "next/link";

type PlanoraLogoProps = {
  href?: string;
  compact?: boolean;
};

export default function PlanoraLogo({
  href = "/dashboard",
  compact = false,
}: PlanoraLogoProps) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-teal-400/25 bg-[#07111f] shadow-[0_0_28px_rgba(20,184,166,0.18)]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-teal-500/10 to-transparent" />
        <div className="absolute -right-4 -top-4 h-9 w-9 rounded-full bg-cyan-300/15" />
        <div className="absolute -bottom-5 -left-5 h-12 w-12 rounded-full bg-teal-400/10" />

        <svg
          viewBox="0 0 48 48"
          className="relative h-8 w-8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M15 36V12H27C32.7 12 36.5 15.4 36.5 20.3C36.5 25.2 32.7 28.5 27 28.5H21"
            stroke="url(#planoraLogoGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M21 28.5L27.2 22.3L34 25.8"
            stroke="#E2E8F0"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          <circle cx="21" cy="28.5" r="2.6" fill="#2DD4BF" />
          <circle cx="27.2" cy="22.3" r="2.6" fill="#67E8F9" />
          <circle cx="34" cy="25.8" r="2.6" fill="#14B8A6" />

          <defs>
            <linearGradient
              id="planoraLogoGradient"
              x1="15"
              y1="12"
              x2="37"
              y2="36"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#67E8F9" />
              <stop offset="0.52" stopColor="#2DD4BF" />
              <stop offset="1" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-tight text-white">
            Planora
          </span>
          <span className="text-sm font-medium text-slate-400">
            Admin dashboard
          </span>
        </div>
      )}
    </Link>
  );
}