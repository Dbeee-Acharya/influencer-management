import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => {
    const token = localStorage.getItem("token");
    if (!token) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <span className="font-semibold tracking-tight">Influencer Hub</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {staff?.name} &middot; <span className="capitalize">{staff?.role}</span>
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
