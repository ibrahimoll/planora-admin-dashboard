"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckSquare,
  FolderKanban,
  Grid2X2,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import PlanoraLogo from "../PlanoraLogo";

type AdminSidebarProps = {
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
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    label: "Admin Logs",
    href: "/dashboard/admin-logs",
    icon: ScrollText,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({
  desktopOpen,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <motion.aside
        layout
        initial={false}
        animate={{
          width: desktopOpen ? 260 : 84,
        }}
        transition={{
          type: "spring",
          stiffness: 340,
          damping: 34,
        }}
        className="z-50 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-[#1d2942] bg-[#0d1424] lg:flex"
      >
        <SidebarContent
          pathname={pathname}
          expanded={desktopOpen}
          mobile={false}
        />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              aria-label="Close sidebar overlay"
              onClick={onCloseMobile}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 36,
              }}
              className="relative flex h-full w-[84%] max-w-[290px] flex-col overflow-hidden border-r border-[#1d2942] bg-[#0d1424] shadow-2xl"
            >
              <div className="flex h-[92px] shrink-0 items-center justify-between border-b border-[#1d2942] px-5">
                <LogoBlock expanded />

                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close sidebar"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1d2942] text-[#8ea3c7] transition hover:border-[#20d6c7]/60 hover:text-[#20d6c7]"
                >
                  <X size={20} />
                </button>
              </div>

              <SidebarContent
                pathname={pathname}
                expanded
                onNavigate={onCloseMobile}
                mobile
              />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  pathname,
  expanded,
  onNavigate,
  mobile = false,
}: {
  pathname: string;
  expanded: boolean;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  return (
    <>
      {!mobile ? (
        <div
          className={[
            "flex h-[92px] shrink-0 items-center border-b border-[#1d2942]",
            expanded ? "px-5" : "justify-center px-3",
          ].join(" ")}
        >
          <LogoBlock expanded={expanded} />
        </div>
      ) : null}

      <nav className="sidebar-nav-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-5">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.18,
                delay: Math.min(index * 0.018, 0.12),
              }}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                title={!expanded ? item.label : undefined}
                className={[
                  "group relative flex min-h-12 items-center rounded-2xl text-sm font-semibold transition-all duration-200",
                  expanded ? "gap-3 px-4 py-3" : "justify-center px-0 py-3",
                  active
                    ? "bg-[#08313c] text-white shadow-[inset_0_0_0_1px_rgba(32,214,199,0.16)]"
                    : "text-[#a9bad7] hover:bg-[#111d31] hover:text-white",
                ].join(" ")}
              >
                {active ? (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-2xl bg-[#08313c]"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 36,
                    }}
                  />
                ) : null}

                <motion.span
                  className="relative z-10 flex h-8 w-8 items-center justify-center"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <Icon
                    size={20}
                    className={[
                      "transition-colors duration-200",
                      active
                        ? "text-[#20d6c7]"
                        : "text-[#7182a5] group-hover:text-[#20d6c7]",
                    ].join(" ")}
                  />
                </motion.span>

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.span
                      key="label"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.14 }}
                      className="relative z-10 truncate"
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[#1d2942] p-3">
        <div
          className={[
            "rounded-2xl border border-emerald-400/15 bg-emerald-400/10",
            expanded ? "p-4" : "p-3",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center",
              expanded ? "gap-3" : "justify-center",
            ].join(" ")}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <ShieldCheck size={18} />
            </span>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="status-copy"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.14 }}
                  className="min-w-0"
                >
                  <p className="text-sm font-semibold text-white">
                    System status
                  </p>
                  <p className="mt-1 truncate text-sm text-[#a9bad7]">
                    Protected routes active
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

function LogoBlock({ expanded }: { expanded: boolean }) {
  if (!expanded) {
    return (
      <div className="flex w-full justify-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#20d6c7]/20 bg-[#20d6c7]/10 text-lg font-bold text-[#20d6c7]">
          P
        </div>
      </div>
    );
  }

  return <PlanoraLogo />;
}