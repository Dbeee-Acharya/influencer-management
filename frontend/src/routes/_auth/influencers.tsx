import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Instagram, Youtube, Facebook, MapPin, Download, X } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InfluencerModal, type Influencer } from "@/components/InfluencerModal";
import { ExportModal } from "@/components/ExportModal";

export const Route = createFileRoute("/_auth/influencers")({
  component: InfluencersPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface FilterState {
  search: string;
  status: string[];
  tier: string[];
  gender: string[];
  platform: string[];
  contentFrequency: string[];
  contentQuality: string[];
  responsiveness: string[];
  brandCostMin: string;
  brandCostMax: string;
  netCostMin: string;
  netCostMax: string;
  grossCostMin: string;
  grossCostMax: string;
  followersMin: string;
  followersMax: string;
  avgViewsMin: string;
  avgViewsMax: string;
  ratingMin: string;
  ratingMax: string;
  location: string;
  primaryNiche: string;
  secondaryNiche: string;
  mainAgeGroup: string;
  videoStyle: string;
  familyStatus: string;
}

interface FilterResponse {
  data: Influencer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTS = ["active", "inactive", "archived"];
const TIER_OPTS = ["nano", "micro", "macro", "mega"];
const GENDER_OPTS = ["male", "female", "non_binary", "prefer_not_to_say"];
const PLATFORM_OPTS = ["instagram", "tiktok", "facebook", "youtube"];
const FREQUENCY_OPTS = [
  "daily",
  "few_times_week",
  "weekly",
  "biweekly",
  "monthly",
];
const QUALITY_OPTS = ["low", "medium", "high"];
const RESPONSIVENESS_OPTS = [
  "very_responsive",
  "responsive",
  "slow",
  "unresponsive",
];
const PAGE_SIZE = 20;

const EMPTY_FILTERS: FilterState = {
  search: "",
  status: [],
  tier: [],
  gender: [],
  platform: [],
  contentFrequency: [],
  contentQuality: [],
  responsiveness: [],
  brandCostMin: "",
  brandCostMax: "",
  netCostMin: "",
  netCostMax: "",
  grossCostMin: "",
  grossCostMax: "",
  followersMin: "",
  followersMax: "",
  avgViewsMin: "",
  avgViewsMax: "",
  ratingMin: "",
  ratingMax: "",
  location: "",
  primaryNiche: "",
  secondaryNiche: "",
  mainAgeGroup: "",
  videoStyle: "",
  familyStatus: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(s: string | null | undefined) {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}
function fmtNpr(v: string | null) {
  if (!v || v === "0.00") return "—";
  return `रू ${Number(v).toLocaleString("en-NP")}`;
}
function fmtFollowers(n: number | null) {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}
const TIER_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  nano: "outline",
  micro: "secondary",
  macro: "secondary",
  mega: "default",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  archived: "outline",
};

// ── Platform Icons ────────────────────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}
const PLATFORM_ICON: Record<string, React.ReactNode> = {
  instagram: <Instagram className="size-4 text-pink-500" />,
  tiktok: <TikTokIcon className="size-4 text-foreground" />,
  facebook: <Facebook className="size-4 text-blue-500" />,
  youtube: <Youtube className="size-4 text-red-500" />,
};
const PLATFORM_COLOR: Record<string, string> = {
  instagram: "text-pink-500",
  tiktok: "text-foreground",
  facebook: "text-blue-500",
  youtube: "text-red-500",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function MultiCheck({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(
      value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt],
    );
  }
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer select-none transition-colors",
              value.includes(opt)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <Checkbox
              checked={value.includes(opt)}
              onCheckedChange={() => toggle(opt)}
              className="hidden"
            />
            {fmt(opt)}
          </label>
        ))}
      </div>
    </div>
  );
}

function RangeInput({
  label,
  minVal,
  maxVal,
  onMinChange,
  onMaxChange,
  prefix,
}: {
  label: string;
  minVal: string;
  maxVal: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  prefix?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            placeholder="Min"
            value={minVal}
            onChange={(e) => onMinChange(e.target.value)}
            className={cn("h-8 text-sm", prefix && "pl-6")}
          />
        </div>
        <span className="text-muted-foreground text-xs">–</span>
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            placeholder="Max"
            value={maxVal}
            onChange={(e) => onMaxChange(e.target.value)}
            className={cn("h-8 text-sm", prefix && "pl-6")}
          />
        </div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {total === 0
          ? "No results"
          : `${from}–${to} of ${total.toLocaleString()}`}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(1)}
          disabled={page === 1}
        >
          «
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
        >
          ‹
        </Button>
        <span className="px-3 py-1 text-sm">
          {page} / {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          ›
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(totalPages)}
          disabled={page >= totalPages}
        >
          »
        </Button>
      </div>
    </div>
  );
}

// ── Filter → body ─────────────────────────────────────────────────────────────

function filtersToBody(f: FilterState, page: number) {
  return {
    ...(f.search && { search: f.search }),
    ...(f.status.length && { status: f.status }),
    ...(f.tier.length && { tier: f.tier }),
    ...(f.gender.length && { gender: f.gender }),
    ...(f.platform.length && { platform: f.platform }),
    ...(f.contentFrequency.length && { contentFrequency: f.contentFrequency }),
    ...(f.contentQuality.length && { contentQuality: f.contentQuality }),
    ...(f.responsiveness.length && { responsiveness: f.responsiveness }),
    ...((f.brandCostMin || f.brandCostMax) && {
      brandCost: {
        ...(f.brandCostMin && { min: Number(f.brandCostMin) }),
        ...(f.brandCostMax && { max: Number(f.brandCostMax) }),
      },
    }),
    ...((f.netCostMin || f.netCostMax) && {
      netCost: {
        ...(f.netCostMin && { min: Number(f.netCostMin) }),
        ...(f.netCostMax && { max: Number(f.netCostMax) }),
      },
    }),
    ...((f.grossCostMin || f.grossCostMax) && {
      grossCost: {
        ...(f.grossCostMin && { min: Number(f.grossCostMin) }),
        ...(f.grossCostMax && { max: Number(f.grossCostMax) }),
      },
    }),
    ...((f.followersMin || f.followersMax) && {
      followers: {
        ...(f.followersMin && { min: Number(f.followersMin) }),
        ...(f.followersMax && { max: Number(f.followersMax) }),
      },
    }),
    ...((f.avgViewsMin || f.avgViewsMax) && {
      avgViews: {
        ...(f.avgViewsMin && { min: Number(f.avgViewsMin) }),
        ...(f.avgViewsMax && { max: Number(f.avgViewsMax) }),
      },
    }),
    ...((f.ratingMin || f.ratingMax) && {
      rating: {
        ...(f.ratingMin && { min: Number(f.ratingMin) }),
        ...(f.ratingMax && { max: Number(f.ratingMax) }),
      },
    }),
    ...(f.location && { location: [f.location] }),
    ...(f.primaryNiche && { primaryNiche: [f.primaryNiche] }),
    ...(f.secondaryNiche && { secondaryNiche: [f.secondaryNiche] }),
    ...(f.mainAgeGroup && { mainAgeGroup: [f.mainAgeGroup] }),
    ...(f.videoStyle && { videoStyle: [f.videoStyle] }),
    ...(f.familyStatus && { familyStatus: [f.familyStatus] }),
    page,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };
}

function isFilterActive(f: FilterState) {
  return JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS);
}

// ── Main page ─────────────────────────────────────────────────────────────────

function InfluencersPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [committed, setCommitted] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Influencer | null>(null);
  const [selectedMap, setSelectedMap] = useState<Map<string, Influencer>>(new Map());
  const [exportOpen, setExportOpen] = useState(false);

  const set = useCallback(
    <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
      setFilters((f) => ({ ...f, [key]: val })),
    [],
  );

  function applyFilters() {
    setCommitted(filters);
    setPage(1);
  }
  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setCommitted(EMPTY_FILTERS);
    setPage(1);
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["influencers", "filter", committed, page],
    queryFn: async () => {
      const { data } = await api.post<FilterResponse>(
        "/influencers/filter",
        filtersToBody(committed, page),
      );
      return data;
    },
  });

  const influencers = data?.data ?? [];
  const active = isFilterActive(committed);

  function toggleInfluencer(inf: Influencer) {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      next.has(inf.id) ? next.delete(inf.id) : next.set(inf.id, inf);
      return next;
    });
  }

  const pageIds = influencers.map((i) => i.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedMap.has(id));
  const somePageSelected = pageIds.some((id) => selectedMap.has(id));

  function toggleAllPage() {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        influencers.forEach((inf) => next.set(inf.id, inf));
      }
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Influencers</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.total.toLocaleString()} results
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
          <Button
            variant={filtersOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            {filtersOpen ? "Hide filters" : "Filters"}
            {active && (
              <span className="ml-1.5 size-2 rounded-full bg-primary inline-block" />
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search name, bio, niche, personality, lifestyle…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="max-w-sm"
        />
        <Button onClick={applyFilters} size="sm">
          Search
        </Button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MultiCheck
                label="Status"
                options={STATUS_OPTS}
                value={filters.status}
                onChange={(v) => set("status", v)}
              />
              <MultiCheck
                label="Tier"
                options={TIER_OPTS}
                value={filters.tier}
                onChange={(v) => set("tier", v)}
              />
              <MultiCheck
                label="Platform"
                options={PLATFORM_OPTS}
                value={filters.platform}
                onChange={(v) => set("platform", v)}
              />
              <MultiCheck
                label="Gender"
                options={GENDER_OPTS}
                value={filters.gender}
                onChange={(v) => set("gender", v)}
              />
              <MultiCheck
                label="Content Frequency"
                options={FREQUENCY_OPTS}
                value={filters.contentFrequency}
                onChange={(v) => set("contentFrequency", v)}
              />
              <MultiCheck
                label="Content Quality"
                options={QUALITY_OPTS}
                value={filters.contentQuality}
                onChange={(v) => set("contentQuality", v)}
              />
              <MultiCheck
                label="Responsiveness"
                options={RESPONSIVENESS_OPTS}
                value={filters.responsiveness}
                onChange={(v) => set("responsiveness", v)}
              />
              <RangeInput
                label="Brand Cost (रू)"
                minVal={filters.brandCostMin}
                maxVal={filters.brandCostMax}
                onMinChange={(v) => set("brandCostMin", v)}
                onMaxChange={(v) => set("brandCostMax", v)}
              />
              <RangeInput
                label="Net Cost (रू)"
                minVal={filters.netCostMin}
                maxVal={filters.netCostMax}
                onMinChange={(v) => set("netCostMin", v)}
                onMaxChange={(v) => set("netCostMax", v)}
              />
              <RangeInput
                label="Gross Cost (रू)"
                minVal={filters.grossCostMin}
                maxVal={filters.grossCostMax}
                onMinChange={(v) => set("grossCostMin", v)}
                onMaxChange={(v) => set("grossCostMax", v)}
              />
              <RangeInput
                label="Followers"
                minVal={filters.followersMin}
                maxVal={filters.followersMax}
                onMinChange={(v) => set("followersMin", v)}
                onMaxChange={(v) => set("followersMax", v)}
              />
              <RangeInput
                label="Avg Views"
                minVal={filters.avgViewsMin}
                maxVal={filters.avgViewsMax}
                onMinChange={(v) => set("avgViewsMin", v)}
                onMaxChange={(v) => set("avgViewsMax", v)}
              />
              <RangeInput
                label="Rating (1–5)"
                minVal={filters.ratingMin}
                maxVal={filters.ratingMax}
                onMinChange={(v) => set("ratingMin", v)}
                onMaxChange={(v) => set("ratingMax", v)}
              />
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Location
                </Label>
                <Input
                  placeholder="e.g. Kathmandu"
                  value={filters.location}
                  onChange={(e) => set("location", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Primary Niche
                </Label>
                <Input
                  placeholder="e.g. Lifestyle"
                  value={filters.primaryNiche}
                  onChange={(e) => set("primaryNiche", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Secondary Niche
                </Label>
                <Input
                  placeholder="e.g. Travel"
                  value={filters.secondaryNiche}
                  onChange={(e) => set("secondaryNiche", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Main Age Group
                </Label>
                <Input
                  placeholder="e.g. 18-24"
                  value={filters.mainAgeGroup}
                  onChange={(e) => set("mainAgeGroup", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Video Style
                </Label>
                <Input
                  placeholder="e.g. Vlog"
                  value={filters.videoStyle}
                  onChange={(e) => set("videoStyle", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Family Status
                </Label>
                <Input
                  placeholder="e.g. Married"
                  value={filters.familyStatus}
                  onChange={(e) => set("familyStatus", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Reset
              </Button>
              <Button size="sm" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div
        className={cn(
          "rounded-lg border overflow-hidden",
          isFetching && "opacity-60 transition-opacity duration-150",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10">
                <Checkbox
                  checked={allPageSelected}
                  data-state={somePageSelected && !allPageSelected ? "indeterminate" : undefined}
                  onCheckedChange={toggleAllPage}
                  aria-label="Select all on page"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Socials</TableHead>
              <TableHead className="text-right">Brand Cost</TableHead>
              <TableHead>Frequency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}>
                      <div
                        className="h-4 rounded bg-muted animate-pulse"
                        style={{ width: `${55 + ((i * j) % 35)}%` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : influencers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-16 text-muted-foreground"
                >
                  No influencers found.
                  {active && " Try adjusting your filters."}
                </TableCell>
              </TableRow>
            ) : (
              influencers.map((inf) => (
                <TableRow
                  key={inf.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/30 transition-colors",
                    selectedMap.has(inf.id) && "bg-primary/5",
                  )}
                  onClick={() => setSelected(inf)}
                >
                  <TableCell
                    onClick={(e) => { e.stopPropagation(); toggleInfluencer(inf); }}
                    className="cursor-default"
                  >
                    <Checkbox
                      checked={selectedMap.has(inf.id)}
                      onCheckedChange={() => toggleInfluencer(inf)}
                      aria-label={`Select ${inf.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{inf.name}</TableCell>
                  <TableCell>
                    {inf.tier ? (
                      <Badge
                        variant={TIER_VARIANT[inf.tier] ?? "secondary"}
                        className="capitalize text-xs"
                      >
                        {inf.tier}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[inf.status] ?? "secondary"}
                      className="capitalize text-xs"
                    >
                      {inf.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-sm">
                    {fmt(inf.gender)}
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm">
                      {inf.primaryNiche ?? "—"}
                    </span>
                    {inf.secondaryNiche && (
                      <span className="block text-xs text-muted-foreground">
                        {inf.secondaryNiche}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="size-3 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-30">
                        {inf.primaryLocation}
                      </span>
                    </div>
                    {inf.secondaryLocation && (
                      <span className="text-xs text-muted-foreground">
                        {inf.secondaryLocation}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {inf.socials.length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        inf.socials.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-1"
                            title={`${s.platform}: ${s.followers != null ? fmtFollowers(s.followers) : "no data"}`}
                          >
                            <span className={PLATFORM_COLOR[s.platform]}>
                              {PLATFORM_ICON[s.platform]}
                            </span>
                            {s.followers != null && (
                              <span className="text-xs text-muted-foreground">
                                {fmtFollowers(s.followers)}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fmtNpr(inf.brandCost)}
                  </TableCell>
                  <TableCell className="capitalize text-sm">
                    {fmt(inf.contentFrequency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 0 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={PAGE_SIZE}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Detail modal */}
      {selected && (
        <InfluencerModal
          influencer={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Export modal */}
      {exportOpen && (
        <ExportModal
          influencers={[...selectedMap.values()]}
          onClose={() => setExportOpen(false)}
        />
      )}

      {/* Floating selection bar */}
      {selectedMap.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-lg ring-1 ring-border">
          <span className="text-sm font-medium">
            {selectedMap.size} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            onClick={() => setExportOpen(true)}
            className="rounded-full h-8 gap-1.5"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedMap(new Map())}
            className="rounded-full h-8 gap-1"
          >
            <X className="size-3.5" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
