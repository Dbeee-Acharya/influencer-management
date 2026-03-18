import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/")({
  component: DashboardPage,
});

interface Influencer {
  id: string;
  tier: string | null;
  status: string;
  primaryNiche: string | null;
  createdAt: string;
}

const tierOrder = ["nano", "micro", "macro", "mega"] as const;

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { staff } = useAuth();

  const { data: influencers = [], isLoading } = useQuery({
    queryKey: ["influencers"],
    queryFn: async () => {
      const { data } = await api.get<Influencer[]>("/influencers");
      return data;
    },
  });

  const active = influencers.filter((i) => i.status === "active").length;
  const inactive = influencers.filter((i) => i.status === "inactive").length;
  const archived = influencers.filter((i) => i.status === "archived").length;

  const byTier = tierOrder.map((tier) => ({
    tier,
    count: influencers.filter((i) => i.tier === tier).length,
  }));

  const topNiches = Object.entries(
    influencers.reduce<Record<string, number>>((acc, i) => {
      if (i.primaryNiche) acc[i.primaryNiche] = (acc[i.primaryNiche] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const tierColors: Record<string, "default" | "secondary" | "outline"> = {
    nano: "outline",
    micro: "secondary",
    macro: "secondary",
    mega: "default",
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {staff?.name}
          </h1>
        </div>
        <Link to="/influencers" className={buttonVariants()}>
          View all influencers →
        </Link>
      </div>

      {/* Stats row */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-3 w-20 rounded bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Influencers" value={influencers.length} />
          <StatCard
            label="Active"
            value={active}
            sub={`${influencers.length ? Math.round((active / influencers.length) * 100) : 0}% of roster`}
          />
          <StatCard label="Inactive" value={inactive} />
          <StatCard label="Archived" value={archived} />
        </div>
      )}

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Influencers by Tier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 rounded bg-muted animate-pulse"
                  />
                ))
              : byTier.map(({ tier, count }) => (
                  <div key={tier} className="flex items-center gap-3">
                    <Badge
                      variant={tierColors[tier]}
                      className="w-16 justify-center capitalize"
                    >
                      {tier}
                    </Badge>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-foreground/70 rounded-full transition-all"
                        style={{
                          width:
                            influencers.length
                              ? `${(count / influencers.length) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">
                      {count}
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Top niches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Niches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 rounded bg-muted animate-pulse"
                  />
                ))
              : topNiches.length === 0
                ? <p className="text-sm text-muted-foreground">No data yet.</p>
                : topNiches.map(([niche, count]) => (
                    <div key={niche} className="flex items-center gap-3">
                      <span className="text-sm flex-1 truncate">{niche}</span>
                      <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-foreground/70 rounded-full transition-all"
                          style={{
                            width: topNiches[0]
                              ? `${(count / topNiches[0][1]) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
