import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ShieldCheck,
  LayoutDashboard,
  FileSearch,
  GitCompareArrows,
  UserSquare2,
  Lock,
  Bell,
  Search,
  FileBarChart,
  Menu,
  Sun,
  Moon,
  X,
  LogOut,
} from "lucide-react";
import { type ReactNode, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useApp, type Role } from "@/lib/app-context";
import { useStore } from "@/lib/store";
import { AlertCard } from "@/components/unveil/AlertCard";
import { useDebounce } from "use-debounce";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, roles: ["officer", "forensic analyst", "security"] as Role[] },
  { to: "/review", label: "Document Review", icon: FileSearch, roles: ["officer", "forensic analyst"] as Role[] },
  { to: "/cross-check", label: "Cross-Check", icon: GitCompareArrows, roles: ["officer", "forensic analyst"] as Role[] },
  { to: "/status", label: "Customer Status", icon: UserSquare2, roles: ["officer", "forensic analyst", "customer"] as Role[] },
  { to: "/reports", label: "Reports", icon: FileBarChart, roles: ["officer", "forensic analyst", "security"] as Role[] },
  { to: "/security", label: "Security & Admin", icon: Lock, roles: ["security", "forensic analyst"] as Role[] },
];


function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_20px_rgba(212,175,55,0.12)] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_28px_rgba(212,175,55,0.2)]">
        <ShieldCheck className="h-4 w-4 text-primary" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">
            UNVEIL<span className="font-light text-primary">360</span>
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Enterprise Console
          </p>
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { role, search: globalSearch, setSearch, openAlert, logout } = useApp();
  const { alerts } = useStore();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const visibleNav = nav.filter((n) => n.roles.includes(role));

  const alertList = Object.values(alerts);
  const hasUnreadAlerts = alertList.some((a) => !a.read);

  const [localSearch, setLocalSearch] = useState(globalSearch);
  const [debouncedSearch] = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const [isLight, setIsLight] = useState(false);

  const toggleTheme = useCallback(() => {
    document.body.classList.add("theme-crossfade");
    setTimeout(() => {
      setIsLight((prev) => !prev);
      setTimeout(() => {
        document.body.classList.remove("theme-crossfade");
      }, 400);
    }, 200);
  }, []);

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [isLight]);

  const [showBanner, setShowBanner] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderNavLinks = () => (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {visibleNav.map((item) => {
        const active = path === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              active
                ? "nav-active-glow bg-primary/8 text-primary"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-0.5",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-all duration-500",
                active ? "text-primary" : "text-muted-foreground group-hover:text-primary/70",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {showBanner && (
        <div className="flex items-center justify-center gap-2 border-b border-primary/15 bg-primary/5 py-2 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90 z-50 backdrop-blur-md">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span>Enterprise Console · Live Neural Analysis Enabled</span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-auto text-primary/60 transition-all duration-300 hover:text-primary hover:scale-110"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden p-0 lg:p-3 lg:gap-3">
        <aside className="hidden w-[260px] shrink-0 lg:flex lg:flex-col z-30">
          <div className="glass-panel flex h-full flex-col overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
            <div className="flex h-[4.5rem] items-center border-b border-white/[0.06] px-5">
              <BrandMark />
            </div>
            {renderNavLinks()}
            <div className="border-t border-white/[0.06] p-4">
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 text-xs backdrop-blur-sm transition-all duration-500 hover:border-primary/15">
                <p className="font-medium text-foreground tracking-wide text-[10px] uppercase">System status</p>
                <p className="mt-2 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-[13px] text-foreground/85 tracking-wide">All services operational</span>
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col relative z-10 overflow-auto rounded-none lg:rounded-3xl">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 glass px-4 sm:px-6 lg:rounded-t-3xl">
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2 rounded-2xl">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[260px] p-0 glass-panel border-white/[0.08] flex flex-col">
                  <div className="flex h-[4.5rem] items-center border-b border-white/[0.06] px-5 shrink-0">
                    <BrandMark />
                  </div>
                  <div className="flex-1 overflow-auto">{renderNavLinks()}</div>
                </SheetContent>
              </Sheet>
              <BrandMark compact />
            </div>

            <div className="hidden flex-1 md:flex">
              <div className="relative max-w-md w-full group">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search application ID, document, customer…"
                  className="rounded-2xl border-white/[0.08] bg-black/20 pl-10 h-10 placeholder:text-muted-foreground/50 transition-all duration-500 focus-visible:ring-primary/30 focus-visible:border-primary/25"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-2xl text-muted-foreground transition-all duration-500 hover:text-primary hover:bg-primary/8"
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              {/* Role switcher removed since we have real auth now */}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-2xl text-muted-foreground transition-all duration-500 hover:text-primary hover:bg-primary/8"
                  >
                    <Bell className="h-4 w-4" />
                    {hasUnreadAlerts && (
                      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-3 glass rounded-2xl border-white/[0.08]">
                  <p className="px-1 pb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Recent alerts
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {alertList.map((a) => (
                      <AlertCard key={a.id} {...a} onClick={() => openAlert(a)} />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Avatar className="h-10 w-10 rounded-2xl border border-primary/20 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_16px_rgba(212,175,55,0.15)] cursor-pointer hidden sm:flex">
                <AvatarFallback className="rounded-2xl bg-primary/10 text-xs font-semibold text-primary">MP</AvatarFallback>
              </Avatar>

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                title="Sign out"
                className="rounded-2xl text-muted-foreground transition-all duration-300 hover:text-red-400 hover:bg-red-500/10"
                onClick={() => {
                  logout();
                  navigate({ to: "/login", replace: true });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-light tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl tracking-wide leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
