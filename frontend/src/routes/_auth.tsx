import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  Link,
  useRouterState,
} from "@tanstack/react-router";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    const token = localStorage.getItem("token");
    if (!token) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

const navLinks = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/influencers", label: "Influencers", exact: false },
] as const;

function AuthLayout() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          {/* Brand */}
          <Link
            to="/"
            className="font-semibold tracking-tight text-sm shrink-0"
          >
            UPTRENDLY
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 flex-1">
            {navLinks.map(({ to, label, exact }) => {
              const active = exact ? pathname === to : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    active
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {staff?.name}
              <span className="ml-1 text-xs capitalize opacity-60">
                ({staff?.role})
              </span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
