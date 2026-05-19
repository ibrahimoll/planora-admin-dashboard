"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  FolderKanban,
  Grid2X2,
  Settings,
  Users,
  X,
} from "lucide-react";
import PlanoraLogo from "@/components/PlanoraLogo";

type SidebarProps = {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Grid2X2,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    label: "Risk",
    href: "/dashboard/risk",
    icon: AlertTriangle,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar({
  desktopOpen,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={[
          desktopOpen ? "hidden lg:flex" : "hidden",
          "h-screen w-[300px] shrink-0 flex-col border-r border-[#1d2942] bg-[#0d1424]",
        ].join(" ")}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="relative flex h-full w-[84%] max-w-[300px] flex-col border-r border-[#1d2942] bg-[#0d1424] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1d2942] px-5 py-5">
              <LogoBlock />

              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1d2942] text-[#8ea3c7] transition hover:border-[#22d3c5]/50 hover:text-[#22d3c5]"
              >
                <X size={20} />
              </button>
            </div>

            <SidebarContent pathname={pathname} onNavigate={onCloseMobile} mobile />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  mobile = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  return (
    <>
      {!mobile ? (
        <div className="border-b border-[#1d2942] px-6 py-5">
          <LogoBlock />
        </div>
      ) : null}

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-7">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition",
                active
                  ? "bg-[#08313c] text-white shadow-[0_0_0_1px_rgba(34,211,197,0.16)]"
                  : "text-[#a9bad7] hover:bg-[#111d31] hover:text-white",
              ].join(" ")}
            >
              <Icon
                size={20}
                className={active ? "text-[#22d3c5]" : "text-[#7182a5]"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-5">
        <div className="rounded-2xl border border-[#1d2942] bg-[#080d1a] p-5">
          <p className="text-sm font-black text-white">System status</p>
          <p className="mt-3 text-sm text-[#a9bad7]">
            Protected routes active
          </p>
        </div>
      </div>
    </>
  );
}

function LogoBlock() {
  return <PlanoraLogo />;
}
