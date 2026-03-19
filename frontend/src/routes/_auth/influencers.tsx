import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { Instagram, Youtube, Facebook, MapPin, Download, X, ChevronDown, SearchX, Star, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

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
  location: string[];
  primaryNiche: string[];
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
  location: [],
  primaryNiche: [],
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
function calcAvgRating(reviews?: Array<{ rating: number | null }>) {
  const ratings = reviews?.map((r) => r.rating).filter((r): r is number => r != null) ?? [];
  if (!ratings.length) return null;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
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

function TagInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState("");

  function addTag(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "");
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5 px-2 py-1.5 rounded-md border bg-background min-h-[34px] focus-within:ring-1 focus-within:ring-ring">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-20 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      {value.length === 0 && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Press Enter or comma to add multiple values
        </p>
      )}
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

function FilterSection({
  title,
  activeCount = 0,
  children,
  defaultOpen = true,
}: {
  title: string;
  activeCount?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-3 text-left transition-colors hover:bg-muted/40 rounded-lg",
          open && "rounded-b-none",
        )}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 leading-none">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground ml-auto transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 grid grid-cols-1 gap-5 border-b border-border/50">
          {children}
        </div>
      )}
      {!open && <div className="border-b border-border/50" />}
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
    ...(f.location.length && { location: f.location }),
    ...(f.primaryNiche.length && { primaryNiche: f.primaryNiche }),
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

type FilterChip = { label: string; keys: (keyof FilterState)[] };

function computeFilterChips(f: FilterState): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.status.length) chips.push({ label: `Status: ${f.status.map((s) => fmt(s)).join(", ")}`, keys: ["status"] });
  if (f.tier.length) chips.push({ label: `Tier: ${f.tier.join(", ")}`, keys: ["tier"] });
  if (f.gender.length) chips.push({ label: `Gender: ${f.gender.map((g) => fmt(g)).join(", ")}`, keys: ["gender"] });
  if (f.platform.length) chips.push({ label: `Platform: ${f.platform.join(", ")}`, keys: ["platform"] });
  if (f.contentFrequency.length) chips.push({ label: `Frequency: ${f.contentFrequency.map((v) => fmt(v)).join(", ")}`, keys: ["contentFrequency"] });
  if (f.contentQuality.length) chips.push({ label: `Quality: ${f.contentQuality.join(", ")}`, keys: ["contentQuality"] });
  if (f.responsiveness.length) chips.push({ label: `Responsiveness: ${f.responsiveness.map((v) => fmt(v)).join(", ")}`, keys: ["responsiveness"] });
  if (f.brandCostMin || f.brandCostMax) chips.push({ label: `Brand Cost: ${f.brandCostMin || "0"}–${f.brandCostMax || "∞"}`, keys: ["brandCostMin", "brandCostMax"] });
  if (f.netCostMin || f.netCostMax) chips.push({ label: `Net Cost: ${f.netCostMin || "0"}–${f.netCostMax || "∞"}`, keys: ["netCostMin", "netCostMax"] });
  if (f.grossCostMin || f.grossCostMax) chips.push({ label: `Gross Cost: ${f.grossCostMin || "0"}–${f.grossCostMax || "∞"}`, keys: ["grossCostMin", "grossCostMax"] });
  if (f.followersMin || f.followersMax) chips.push({ label: `Followers: ${f.followersMin || "0"}–${f.followersMax || "∞"}`, keys: ["followersMin", "followersMax"] });
  if (f.avgViewsMin || f.avgViewsMax) chips.push({ label: `Avg Views: ${f.avgViewsMin || "0"}–${f.avgViewsMax || "∞"}`, keys: ["avgViewsMin", "avgViewsMax"] });
  if (f.ratingMin || f.ratingMax) chips.push({ label: `Rating: ${f.ratingMin || "1"}–${f.ratingMax || "5"}`, keys: ["ratingMin", "ratingMax"] });
  if (f.location.length) chips.push({ label: `Location: ${f.location.join(", ")}`, keys: ["location"] });
  if (f.primaryNiche.length) chips.push({ label: `Niche: ${f.primaryNiche.join(", ")}`, keys: ["primaryNiche"] });
  if (f.secondaryNiche) chips.push({ label: `2nd Niche: ${f.secondaryNiche}`, keys: ["secondaryNiche"] });
  if (f.mainAgeGroup) chips.push({ label: `Age Group: ${f.mainAgeGroup}`, keys: ["mainAgeGroup"] });
  if (f.videoStyle) chips.push({ label: `Video Style: ${f.videoStyle}`, keys: ["videoStyle"] });
  if (f.familyStatus) chips.push({ label: `Family: ${f.familyStatus}`, keys: ["familyStatus"] });
  return chips;
}

// ── Create Influencer Dialog ───────────────────────────────────────────────────

interface SocialDraft {
  platform: "instagram" | "tiktok" | "facebook" | "youtube";
  profileUrl: string;
  followers: string;
  avgViews: string;
}

const EMPTY_SOCIAL: SocialDraft = { platform: "instagram", profileUrl: "", followers: "", avgViews: "" };

const EMPTY_CREATE_FORM = {
  name: "",
  primaryLocation: "",
  secondaryLocation: "",
  tertiaryLocation: "",
  tier: "",
  status: "active",
  gender: "",
  contactNo: "",
  description: "",
  familyStatus: "",
  mainAgeGroup: "",
  primaryNiche: "",
  secondaryNiche: "",
  contentFrequency: "",
  contentQuality: "",
  videoStyle: "",
  personality: "",
  lifestyleTraits: "",
  responsiveness: "",
  availability: "",
  brandCost: "",
  netCost: "",
  grossCost: "",
  bio: "",
};

function CreateInfluencerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_CREATE_FORM });
  const [socials, setSocials] = useState<SocialDraft[]>([]);
  const [tab, setTab] = useState("basic");

  function setField(key: keyof typeof EMPTY_CREATE_FORM, val: string | null) {
    setForm((f) => ({ ...f, [key]: val ?? "" }));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: form.name,
        primaryLocation: form.primaryLocation,
      };
      const optionalStr = [
        "secondaryLocation", "tertiaryLocation", "tier", "status", "gender",
        "contactNo", "description", "familyStatus", "mainAgeGroup",
        "primaryNiche", "secondaryNiche", "contentFrequency", "contentQuality",
        "videoStyle", "personality", "lifestyleTraits", "responsiveness",
        "availability", "bio",
      ] as const;
      for (const k of optionalStr) {
        if (form[k]) body[k] = form[k];
      }
      if (form.brandCost) body.brandCost = form.brandCost;
      if (form.netCost) body.netCost = form.netCost;
      if (form.grossCost) body.grossCost = form.grossCost;
      if (socials.length) {
        body.socials = socials.map((s) => ({
          platform: s.platform,
          ...(s.profileUrl && { profileUrl: s.profileUrl }),
          ...(s.followers && { followers: Number(s.followers) }),
          ...(s.avgViews && { avgViews: Number(s.avgViews) }),
        }));
      }
      await api.post("/influencers", body);
    },
    onSuccess: () => {
      toast.success("Influencer created");
      onCreated();
      onClose();
      setForm({ ...EMPTY_CREATE_FORM });
      setSocials([]);
      setTab("basic");
    },
    onError: () => {
      toast.error("Failed to create influencer");
    },
  });

  function updateSocial(i: number, key: keyof SocialDraft, val: string) {
    setSocials((s) => s.map((social, idx) => (idx === i ? { ...social, [key]: val } : social)));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Add Influencer</DialogTitle>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-6 mt-4 w-auto justify-start shrink-0">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="socials">Socials {socials.length > 0 && `(${socials.length})`}</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0 max-h-[440px]">
            <TabsContent value="basic" className="px-6 py-4 grid grid-cols-2 gap-4 mt-0">
              <div className="col-span-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Influencer name" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Primary Location <span className="text-destructive">*</span></Label>
                <Input value={form.primaryLocation} onChange={(e) => setField("primaryLocation", e.target.value)} placeholder="e.g. Kathmandu" className="mt-1" />
              </div>
              <div>
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setField("tier", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select tier" /></SelectTrigger>
                  <SelectContent>
                    {TIER_OPTS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setField("gender", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTS.map((g) => <SelectItem key={g} value={g}>{fmt(g)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact No.</Label>
                <Input value={form.contactNo} onChange={(e) => setField("contactNo", e.target.value)} placeholder="+977 …" className="mt-1" />
              </div>
              <div>
                <Label>Main Age Group</Label>
                <Input value={form.mainAgeGroup} onChange={(e) => setField("mainAgeGroup", e.target.value)} placeholder="e.g. 18-24" className="mt-1" />
              </div>
              <div>
                <Label>Family Status</Label>
                <Input value={form.familyStatus} onChange={(e) => setField("familyStatus", e.target.value)} placeholder="e.g. Married" className="mt-1" />
              </div>
              <div>
                <Label>Secondary Location</Label>
                <Input value={form.secondaryLocation} onChange={(e) => setField("secondaryLocation", e.target.value)} placeholder="e.g. Pokhara" className="mt-1" />
              </div>
              <div>
                <Label>Tertiary Location</Label>
                <Input value={form.tertiaryLocation} onChange={(e) => setField("tertiaryLocation", e.target.value)} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Short internal description" className="mt-1 resize-none" rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={(e) => setField("bio", e.target.value)} placeholder="Public biography" className="mt-1 resize-none" rows={2} />
              </div>
            </TabsContent>

            <TabsContent value="content" className="px-6 py-4 grid grid-cols-2 gap-4 mt-0">
              <div>
                <Label>Primary Niche</Label>
                <Input value={form.primaryNiche} onChange={(e) => setField("primaryNiche", e.target.value)} placeholder="e.g. Fitness" className="mt-1" />
              </div>
              <div>
                <Label>Secondary Niche</Label>
                <Input value={form.secondaryNiche} onChange={(e) => setField("secondaryNiche", e.target.value)} placeholder="e.g. Travel" className="mt-1" />
              </div>
              <div>
                <Label>Content Frequency</Label>
                <Select value={form.contentFrequency} onValueChange={(v) => setField("contentFrequency", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_OPTS.map((f) => <SelectItem key={f} value={f}>{fmt(f)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content Quality</Label>
                <Select value={form.contentQuality} onValueChange={(v) => setField("contentQuality", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select quality" /></SelectTrigger>
                  <SelectContent>
                    {QUALITY_OPTS.map((q) => <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Video Style</Label>
                <Input value={form.videoStyle} onChange={(e) => setField("videoStyle", e.target.value)} placeholder="e.g. Vlog, Tutorial" className="mt-1" />
              </div>
              <div>
                <Label>Personality</Label>
                <Input value={form.personality} onChange={(e) => setField("personality", e.target.value)} placeholder="e.g. Funny, Relatable" className="mt-1" />
              </div>
              <div>
                <Label>Responsiveness</Label>
                <Select value={form.responsiveness} onValueChange={(v) => setField("responsiveness", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {RESPONSIVENESS_OPTS.map((r) => <SelectItem key={r} value={r}>{fmt(r)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Availability</Label>
                <Input value={form.availability} onChange={(e) => setField("availability", e.target.value)} placeholder="e.g. Weekdays only" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Lifestyle Traits</Label>
                <Textarea value={form.lifestyleTraits} onChange={(e) => setField("lifestyleTraits", e.target.value)} placeholder="e.g. Vegan, Traveler, Gym-goer" className="mt-1 resize-none" rows={2} />
              </div>
            </TabsContent>

            <TabsContent value="costs" className="px-6 py-4 grid grid-cols-2 gap-4 mt-0">
              <div>
                <Label>Brand Cost (रू)</Label>
                <Input type="number" value={form.brandCost} onChange={(e) => setField("brandCost", e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>Net Cost (रू)</Label>
                <Input type="number" value={form.netCost} onChange={(e) => setField("netCost", e.target.value)} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>Gross Cost (रू)</Label>
                <Input type="number" value={form.grossCost} onChange={(e) => setField("grossCost", e.target.value)} placeholder="0" className="mt-1" />
              </div>
            </TabsContent>

            <TabsContent value="socials" className="px-6 py-4 space-y-3 mt-0">
              {socials.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No social accounts added yet.</p>
              )}
              {socials.map((s, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 p-3 rounded-lg border">
                  <div className="col-span-2 flex items-center justify-between">
                    <Select value={s.platform} onValueChange={(v) => updateSocial(i, "platform", v as SocialDraft["platform"])}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon-sm" onClick={() => setSocials((s) => s.filter((_, idx) => idx !== i))}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Profile URL</Label>
                    <Input value={s.profileUrl} onChange={(e) => updateSocial(i, "profileUrl", e.target.value)} placeholder="https://…" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Followers</Label>
                    <Input type="number" value={s.followers} onChange={(e) => updateSocial(i, "followers", e.target.value)} placeholder="0" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Avg Views</Label>
                    <Input type="number" value={s.avgViews} onChange={(e) => updateSocial(i, "avgViews", e.target.value)} placeholder="0" className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setSocials((s) => [...s, { ...EMPTY_SOCIAL }])} className="w-full gap-1.5">
                <Plus className="size-4" /> Add social account
              </Button>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="px-6 py-4 border-t flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.primaryLocation || mutation.isPending}
          >
            {mutation.isPending ? "Creating…" : "Create Influencer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function InfluencersPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [committed, setCommitted] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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
  function removeChip(keys: (keyof FilterState)[]) {
    const patch = Object.fromEntries(
      keys.map((k) => [k, EMPTY_FILTERS[k]]),
    ) as Partial<FilterState>;
    setFilters((f) => ({ ...f, ...patch }));
    setCommitted((f) => ({ ...f, ...patch }));
    setPage(1);
  }

  // Debounced auto-search: only commits the search field, not pending panel filters
  useEffect(() => {
    const t = setTimeout(() => {
      setCommitted((prev) => ({ ...prev, search: filters.search }));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

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
  const chips = computeFilterChips(committed);
  // Count filter groups, excluding search (shown inline)
  const filterCount = computeFilterChips({ ...committed, search: "" }).length;

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
            variant={filterCount > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
            {filterCount > 0 ? (
              <span className="ml-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 leading-none">
                {filterCount}
              </span>
            ) : null}
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              Add Influencer
            </Button>
          )}
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

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.keys.join(",")}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-foreground"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => removeChip(chip.keys)}
                className="rounded-full hover:bg-primary/15 p-0.5"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-[380px] sm:max-w-[380px] p-0 flex flex-col gap-0">
          {/* Sheet header */}
          <SheetHeader className="px-5 py-4 border-b flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base">Filters</SheetTitle>
              {filterCount > 0 && (
                <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 leading-none">
                  {filterCount} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {active && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { clearFilters(); setFiltersOpen(false); }}>
                  Clear all
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => setFiltersOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const basicCount = [
                filters.status.length, filters.tier.length, filters.gender.length,
                filters.responsiveness.length, filters.mainAgeGroup ? 1 : 0, filters.familyStatus ? 1 : 0,
              ].reduce((a, b) => a + b, 0);

              const contentCount = [
                filters.platform.length, filters.contentFrequency.length, filters.contentQuality.length,
                filters.primaryNiche.length, filters.secondaryNiche ? 1 : 0, filters.videoStyle ? 1 : 0,
              ].reduce((a, b) => a + b, 0);

              const reachCount = [
                filters.followersMin || filters.followersMax ? 1 : 0,
                filters.avgViewsMin || filters.avgViewsMax ? 1 : 0,
                filters.ratingMin || filters.ratingMax ? 1 : 0,
                filters.brandCostMin || filters.brandCostMax ? 1 : 0,
                filters.netCostMin || filters.netCostMax ? 1 : 0,
                filters.grossCostMin || filters.grossCostMax ? 1 : 0,
              ].reduce((a, b) => a + b, 0);

              const locationCount = filters.location.length;

              return (
                <>
                  <FilterSection title="Basic" activeCount={basicCount}>
                    <MultiCheck label="Status" options={STATUS_OPTS} value={filters.status} onChange={(v) => set("status", v)} />
                    <MultiCheck label="Tier" options={TIER_OPTS} value={filters.tier} onChange={(v) => set("tier", v)} />
                    <MultiCheck label="Gender" options={GENDER_OPTS} value={filters.gender} onChange={(v) => set("gender", v)} />
                    <MultiCheck label="Responsiveness" options={RESPONSIVENESS_OPTS} value={filters.responsiveness} onChange={(v) => set("responsiveness", v)} />
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Main Age Group</Label>
                      <Input placeholder="e.g. 18-24" value={filters.mainAgeGroup} onChange={(e) => set("mainAgeGroup", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Family Status</Label>
                      <Input placeholder="e.g. Married" value={filters.familyStatus} onChange={(e) => set("familyStatus", e.target.value)} className="h-8 text-sm" />
                    </div>
                  </FilterSection>

                  <FilterSection title="Content" activeCount={contentCount}>
                    <MultiCheck label="Platform" options={PLATFORM_OPTS} value={filters.platform} onChange={(v) => set("platform", v)} />
                    <MultiCheck label="Content Frequency" options={FREQUENCY_OPTS} value={filters.contentFrequency} onChange={(v) => set("contentFrequency", v)} />
                    <MultiCheck label="Content Quality" options={QUALITY_OPTS} value={filters.contentQuality} onChange={(v) => set("contentQuality", v)} />
                    <TagInput label="Primary Niche" value={filters.primaryNiche} onChange={(v) => set("primaryNiche", v)} placeholder="e.g. Lifestyle" />
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Secondary Niche</Label>
                      <Input placeholder="e.g. Travel" value={filters.secondaryNiche} onChange={(e) => set("secondaryNiche", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Video Style</Label>
                      <Input placeholder="e.g. Vlog" value={filters.videoStyle} onChange={(e) => set("videoStyle", e.target.value)} className="h-8 text-sm" />
                    </div>
                  </FilterSection>

                  <FilterSection title="Reach & Cost" activeCount={reachCount} defaultOpen={false}>
                    <RangeInput label="Followers" minVal={filters.followersMin} maxVal={filters.followersMax} onMinChange={(v) => set("followersMin", v)} onMaxChange={(v) => set("followersMax", v)} />
                    <RangeInput label="Avg Views" minVal={filters.avgViewsMin} maxVal={filters.avgViewsMax} onMinChange={(v) => set("avgViewsMin", v)} onMaxChange={(v) => set("avgViewsMax", v)} />
                    <RangeInput label="Rating (1–5)" minVal={filters.ratingMin} maxVal={filters.ratingMax} onMinChange={(v) => set("ratingMin", v)} onMaxChange={(v) => set("ratingMax", v)} />
                    <RangeInput label="Brand Cost (रू)" minVal={filters.brandCostMin} maxVal={filters.brandCostMax} onMinChange={(v) => set("brandCostMin", v)} onMaxChange={(v) => set("brandCostMax", v)} />
                    <RangeInput label="Net Cost (रू)" minVal={filters.netCostMin} maxVal={filters.netCostMax} onMinChange={(v) => set("netCostMin", v)} onMaxChange={(v) => set("netCostMax", v)} />
                    <RangeInput label="Gross Cost (रू)" minVal={filters.grossCostMin} maxVal={filters.grossCostMax} onMinChange={(v) => set("grossCostMin", v)} onMaxChange={(v) => set("grossCostMax", v)} />
                  </FilterSection>

                  <FilterSection title="Location" activeCount={locationCount} defaultOpen={false}>
                    <TagInput label="Location" value={filters.location} onChange={(v) => set("location", v)} placeholder="e.g. Kathmandu" />
                  </FilterSection>
                </>
              );
            })()}
          </div>

          {/* Footer */}
          <SheetFooter className="border-t p-4 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => { applyFilters(); setFiltersOpen(false); }}>
              Apply filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
                  indeterminate={somePageSelected && !allPageSelected}
                  checked={allPageSelected}
                  onCheckedChange={toggleAllPage}
                  aria-label="Select all on page"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Socials</TableHead>
              <TableHead className="text-right">Brand Cost</TableHead>
              <TableHead className="text-right">Net Cost</TableHead>
              <TableHead>Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
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
                <TableCell colSpan={9} className="py-20">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <SearchX className="size-10 opacity-30" />
                    <p className="text-sm font-medium">No influencers found</p>
                    {active && (
                      <p className="text-xs">Try adjusting or clearing your filters.</p>
                    )}
                  </div>
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
                    <div className="flex flex-col gap-1">
                      {inf.socials.length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        inf.socials.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-1.5"
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
                            {s.avgViews != null && (
                              <span className="text-xs text-muted-foreground/60">
                                · {fmtFollowers(s.avgViews)} views
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
                  <TableCell className="text-right font-mono text-sm">
                    {fmtNpr(inf.netCost)}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const avg = calcAvgRating(inf.reviews);
                      if (avg == null) return <span className="text-muted-foreground text-xs">—</span>;
                      return (
                        <div className="flex items-center gap-1">
                          <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{avg.toFixed(1)}</span>
                        </div>
                      );
                    })()}
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

      {/* Create influencer dialog */}
      <CreateInfluencerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["influencers"] })}
      />

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
