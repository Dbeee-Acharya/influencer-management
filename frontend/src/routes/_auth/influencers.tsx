import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Influencer {
  id: string;
  name: string;
  tier: string | null;
  status: string;
  primaryNiche: string | null;
  primaryLocation: string;
  brandCost: string | null;
  contentFrequency: string | null;
}

export const Route = createFileRoute("/_auth/influencers")({
  component: InfluencersPage,
});

const tierColors: Record<string, string> = {
  nano: "secondary",
  micro: "default",
  macro: "outline",
  mega: "destructive",
};

function InfluencersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["influencers"],
    queryFn: async () => {
      const { data } = await api.get<Influencer[]>("/influencers");
      return data;
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (isError) return <p className="text-destructive">Failed to load influencers.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Influencers</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Niche</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Brand Cost</TableHead>
            <TableHead>Frequency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((inf) => (
            <TableRow key={inf.id}>
              <TableCell className="font-medium">{inf.name}</TableCell>
              <TableCell>
                {inf.tier && (
                  <Badge variant={tierColors[inf.tier] as "default" | "secondary" | "outline" | "destructive" ?? "secondary"}>
                    {inf.tier}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={inf.status === "active" ? "default" : "secondary"}>
                  {inf.status}
                </Badge>
              </TableCell>
              <TableCell>{inf.primaryNiche ?? "—"}</TableCell>
              <TableCell>{inf.primaryLocation}</TableCell>
              <TableCell>
                {inf.brandCost ? `$${Number(inf.brandCost).toLocaleString()}` : "—"}
              </TableCell>
              <TableCell>{inf.contentFrequency?.replace(/_/g, " ") ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
