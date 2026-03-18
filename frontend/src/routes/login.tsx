import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      login(data.token);
      navigate({ to: "/" });
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ backgroundColor: "#4a4f5a" }}
      >
        {/* Background decoration */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#4BBFC3" }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ backgroundColor: "#4BBFC3" }}
        />
        <div
          className="absolute top-1/2 right-0 w-48 h-48 rounded-full opacity-5"
          style={{ backgroundColor: "#4BBFC3" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/android-chrome-192x192.png"
            alt="Uptrendly"
            className="w-10 h-10"
          />
          <span className="text-white font-bold text-xl tracking-wide">
            UPTRENDLY
          </span>
        </div>

        {/* Quote */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-white text-3xl font-light leading-snug">
            "Let's create things that matter.
            <br />
            <span style={{ color: "#4BBFC3" }} className="font-semibold">
              Be productive, enjoy the ride.
            </span>
            "
          </blockquote>
          <p className="text-white/50 text-sm">
            Every great campaign starts with the right creator.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-8">
          {[
            { label: "Creators", value: "UPLIFT" },
            { label: "Campaigns", value: "CREATE" },
            { label: "Brands", value: "EMPOWER" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-white font-bold text-2xl">{value}</p>
              <p className="text-white/50 text-xs uppercase tracking-widest">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col flex-1 items-center justify-center p-8 bg-background">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <img
            src="/android-chrome-192x192.png"
            alt="Uptrendly"
            className="w-8 h-8"
          />
          <span className="font-bold text-lg tracking-wide">UPTRENDLY</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to your workspace and get things moving.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@uptrendly.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={loading}
              style={{ backgroundColor: "#4BBFC3", color: "#fff" }}
            >
              {loading ? "Signing in…" : "Sign in →"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Only authorized team members can access this platform.
          </p>
        </div>
      </div>
    </div>
  );
}
