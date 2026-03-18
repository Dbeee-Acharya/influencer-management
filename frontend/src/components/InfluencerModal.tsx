import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Instagram,
  Youtube,
  Facebook,
  MapPin,
  Phone,
  ExternalLink,
  Star,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Social {
  id: number;
  platform: "instagram" | "tiktok" | "facebook" | "youtube";
  profileUrl: string | null;
  followers: number | null;
  avgViews: number | null;
}

export interface Influencer {
  id: string;
  name: string;
  tier: string | null;
  netCost: string | null;
  grossCost: string | null;
  brandCost: string | null;
  description: string | null;
  contactNo: string | null;
  status: string;
  gender: string | null;
  familyStatus: string | null;
  primaryNiche: string | null;
  secondaryNiche: string | null;
  bio: string | null;
  mainAgeGroup: string | null;
  videoStyle: string | null;
  personality: string | null;
  contentFrequency: string | null;
  contentQuality: string | null;
  availability: string | null;
  responsiveness: string | null;
  lifestyleTraits: string | null;
  primaryLocation: string;
  secondaryLocation: string | null;
  tertiaryLocation: string | null;
  createdAt: string;
  updatedAt: string;
  socials: Social[];
  reviews?: Array<{ id: number; rating: number | null }>;
}

interface Review {
  id: number;
  rating: number | null;
  review: string | null;
  createdAt: string;
  staff: { id: number; name: string };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_OPTS = ["nano", "micro", "macro", "mega"];
const STATUS_OPTS = ["active", "inactive", "archived"];
const GENDER_OPTS = ["male", "female", "non_binary", "prefer_not_to_say"];
const FREQUENCY_OPTS = ["daily", "few_times_week", "weekly", "biweekly", "monthly"];
const QUALITY_OPTS = ["low", "medium", "high"];
const RESPONSIVENESS_OPTS = ["very_responsive", "responsive", "slow", "unresponsive"];

const TIER_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  nano: "outline", micro: "secondary", macro: "secondary", mega: "default",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default", inactive: "secondary", archived: "outline",
};
const PLATFORM_COLOR: Record<string, string> = {
  instagram: "text-pink-500", tiktok: "text-foreground",
  facebook: "text-blue-500", youtube: "text-red-500",
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
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" });
}

// ── Platform Icons ─────────────────────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  instagram: <Instagram className="size-4" />,
  tiktok: <TikTokIcon className="size-4" />,
  facebook: <Facebook className="size-4" />,
  youtube: <Youtube className="size-4" />,
};

// ── Small UI helpers ──────────────────────────────────────────────────────────

function Field({ label, value, mono, wide }: { label: string; value?: string | null; mono?: boolean; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={cn("text-sm leading-snug", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function PillToggle({ options, value, onChange }: {
  options: string[];
  value: string | string[];
  onChange: (v: string) => void;
}) {
  const active = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-2.5 py-1 rounded-full border text-xs transition-colors capitalize",
            active.includes(opt)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          {fmt(opt)}
        </button>
      ))}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={cn("size-5 transition-colors", n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

// ── Details Tab ───────────────────────────────────────────────────────────────

function DetailsTab({ inf }: { inf: Influencer }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Socials */}
        {inf.socials.length > 0 && (
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Socials</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inf.socials.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <span className={PLATFORM_COLOR[s.platform]}>{PLATFORM_ICON[s.platform]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium capitalize">{s.platform}</p>
                    {s.profileUrl && (
                      <a
                        href={s.profileUrl.startsWith("http") ? s.profileUrl : `https://${s.profileUrl}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="truncate">{s.profileUrl}</span>
                        <ExternalLink className="size-2.5 shrink-0" />
                      </a>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {s.followers != null && <p className="text-sm font-semibold">{fmtFollowers(s.followers)}</p>}
                    {s.avgViews != null && <p className="text-[11px] text-muted-foreground">{fmtFollowers(s.avgViews)} views</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Separator />

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="Primary Niche" value={inf.primaryNiche} />
          <Field label="Secondary Niche" value={inf.secondaryNiche} />
          <Field label="Gender" value={fmt(inf.gender)} />
          <Field label="Family Status" value={inf.familyStatus} />
          <Field label="Main Age Group" value={inf.mainAgeGroup} />
          <Field label="Personality" value={inf.personality} />
          <Field label="Video Style" value={inf.videoStyle} />
          <Field label="Availability" value={inf.availability} />
          <Field label="Content Frequency" value={fmt(inf.contentFrequency)} />
          <Field label="Content Quality" value={inf.contentQuality} />
          <Field label="Responsiveness" value={fmt(inf.responsiveness)} />

          {inf.contactNo && (
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Contact</p>
              <a href={`tel:${inf.contactNo}`} className="text-sm font-mono flex items-center gap-1 hover:text-primary">
                <Phone className="size-3" />{inf.contactNo}
              </a>
            </div>
          )}

          {/* Location */}
          <div className="col-span-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              {[inf.primaryLocation, inf.secondaryLocation, inf.tertiaryLocation]
                .filter(Boolean).join(" · ")}
            </div>
          </div>

          <Field label="Lifestyle Traits" value={inf.lifestyleTraits} wide />
          <Field label="Description" value={inf.description} wide />
          <Field label="Bio" value={inf.bio} wide />
        </div>

        <Separator />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Created {fmtDate(inf.createdAt)}</span>
          <span>Updated {fmtDate(inf.updatedAt)}</span>
          <span className="font-mono text-[10px] ml-auto opacity-40">{inf.id}</span>
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Edit Tab ──────────────────────────────────────────────────────────────────

function EditTab({ inf, onSaved }: { inf: Influencer; onSaved: (updated: Influencer) => void }) {
  const { canEdit } = useAuth();
  const qc = useQueryClient();

  type EditForm = {
    name: string; status: string; tier: string; gender: string;
    familyStatus: string; contactNo: string; personality: string;
    mainAgeGroup: string; videoStyle: string; availability: string;
    primaryNiche: string; secondaryNiche: string;
    contentFrequency: string; contentQuality: string; responsiveness: string;
    primaryLocation: string; secondaryLocation: string; tertiaryLocation: string;
    netCost: string; grossCost: string; brandCost: string;
    description: string; bio: string; lifestyleTraits: string;
  };

  const [form, setForm] = useState<EditForm>({
    name: inf.name ?? "",
    status: inf.status ?? "active",
    tier: inf.tier ?? "",
    gender: inf.gender ?? "",
    familyStatus: inf.familyStatus ?? "",
    contactNo: inf.contactNo ?? "",
    personality: inf.personality ?? "",
    mainAgeGroup: inf.mainAgeGroup ?? "",
    videoStyle: inf.videoStyle ?? "",
    availability: inf.availability ?? "",
    primaryNiche: inf.primaryNiche ?? "",
    secondaryNiche: inf.secondaryNiche ?? "",
    contentFrequency: inf.contentFrequency ?? "",
    contentQuality: inf.contentQuality ?? "",
    responsiveness: inf.responsiveness ?? "",
    primaryLocation: inf.primaryLocation ?? "",
    secondaryLocation: inf.secondaryLocation ?? "",
    tertiaryLocation: inf.tertiaryLocation ?? "",
    netCost: inf.netCost ? String(Number(inf.netCost)) : "",
    grossCost: inf.grossCost ? String(Number(inf.grossCost)) : "",
    brandCost: inf.brandCost ? String(Number(inf.brandCost)) : "",
    description: inf.description ?? "",
    bio: inf.bio ?? "",
    lifestyleTraits: inf.lifestyleTraits ?? "",
  });

  const f = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const set = (k: keyof EditForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      const numFields = ["netCost", "grossCost", "brandCost"] as const;
      for (const [k, v] of Object.entries(form)) {
        if (numFields.includes(k as typeof numFields[number])) {
          payload[k] = v === "" ? null : Number(v);
        } else {
          payload[k] = v === "" ? null : v;
        }
      }
      const { data } = await api.patch<Influencer>(`/influencers/${inf.id}`, payload);
      return data;
    },
    onSuccess: (updated) => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["influencers"] });
      onSaved({ ...inf, ...updated });
    },
    onError: () => toast.error("Failed to save"),
  });

  if (!canEdit) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        You don't have permission to edit.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Basic */}
        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Basic</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Name *</Label>
              <Input value={form.name} onChange={f("name")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Status</Label>
              <PillToggle options={STATUS_OPTS} value={form.status} onChange={(v) => set("status", v)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Tier</Label>
              <PillToggle options={TIER_OPTS} value={form.tier} onChange={(v) => set("tier", v === form.tier ? "" : v)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Gender</Label>
              <PillToggle options={GENDER_OPTS} value={form.gender} onChange={(v) => set("gender", v === form.gender ? "" : v)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Family Status</Label>
              <Input value={form.familyStatus} onChange={f("familyStatus")} placeholder="e.g. Married" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Contact No.</Label>
              <Input value={form.contactNo} onChange={f("contactNo")} placeholder="+977 98..." />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Main Age Group</Label>
              <Input value={form.mainAgeGroup} onChange={f("mainAgeGroup")} placeholder="e.g. 18-24" />
            </div>
          </div>
        </section>

        <Separator />

        {/* Location */}
        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Location</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">Primary *</Label>
              <Input value={form.primaryLocation} onChange={f("primaryLocation")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Secondary</Label>
              <Input value={form.secondaryLocation} onChange={f("secondaryLocation")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Tertiary</Label>
              <Input value={form.tertiaryLocation} onChange={f("tertiaryLocation")} />
            </div>
          </div>
        </section>

        <Separator />

        {/* Niches */}
        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Niches</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">Primary Niche</Label>
              <Input value={form.primaryNiche} onChange={f("primaryNiche")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Secondary Niche</Label>
              <Input value={form.secondaryNiche} onChange={f("secondaryNiche")} />
            </div>
          </div>
        </section>

        <Separator />

        {/* Content */}
        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Content</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1.5 block">Personality</Label>
              <Input value={form.personality} onChange={f("personality")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Video Style</Label>
              <Input value={form.videoStyle} onChange={f("videoStyle")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Availability</Label>
              <Input value={form.availability} onChange={f("availability")} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Frequency</Label>
              <PillToggle options={FREQUENCY_OPTS} value={form.contentFrequency} onChange={(v) => set("contentFrequency", v === form.contentFrequency ? "" : v)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Quality</Label>
              <PillToggle options={QUALITY_OPTS} value={form.contentQuality} onChange={(v) => set("contentQuality", v === form.contentQuality ? "" : v)} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Responsiveness</Label>
              <PillToggle options={RESPONSIVENESS_OPTS} value={form.responsiveness} onChange={(v) => set("responsiveness", v === form.responsiveness ? "" : v)} />
            </div>
          </div>
        </section>

        <Separator />

        {/* Costs */}
        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Costs (NPR)</p>
          <div className="grid grid-cols-3 gap-4">
            {(["brandCost", "netCost", "grossCost"] as const).map((field) => (
              <div key={field}>
                <Label className="text-xs mb-1.5 block capitalize">{field.replace("Cost", " Cost")}</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">रू</span>
                  <Input type="number" value={form[field]} onChange={f(field)} className="pl-6" placeholder="0" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Long text */}
        <section className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">About</p>
          {(["description", "bio", "lifestyleTraits"] as const).map((field) => (
            <div key={field}>
              <Label className="text-xs mb-1.5 block capitalize">{field === "lifestyleTraits" ? "Lifestyle Traits" : field}</Label>
              <Textarea value={form[field]} onChange={f(field)} rows={3} className="resize-none text-sm" />
            </div>
          ))}
        </section>

        <div className="pb-2 flex justify-end">
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

// ── Reviews Tab ───────────────────────────────────────────────────────────────

function ReviewsTab({ inf }: { inf: Influencer }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["influencer-reviews", inf.id],
    queryFn: async () => {
      const { data } = await api.get<Review[]>(`/influencers/${inf.id}/reviews`);
      return data;
    },
  });

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: () =>
      api.post(`/influencers/${inf.id}/reviews`, {
        rating: rating || null,
        review: reviewText || null,
      }),
    onSuccess: () => {
      toast.success("Review submitted");
      setRating(0);
      setReviewText("");
      qc.invalidateQueries({ queryKey: ["influencer-reviews", inf.id] });
    },
    onError: () => toast.error("Failed to submit review"),
  });

  return (
    <div className="flex flex-col h-full">
      {/* Add review form */}
      <div className="p-6 border-b space-y-3 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Add Review</p>
        <StarRating value={rating} onChange={setRating} />
        <Textarea
          placeholder="Write your review…"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => submitReview()}
            disabled={isPending || (!rating && !reviewText)}
          >
            {isPending ? "Submitting…" : "Submit review"}
          </Button>
        </div>
      </div>

      {/* Reviews list */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full rounded bg-muted animate-pulse" />
              </div>
            ))
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.staff.name}</span>
                    {r.rating != null && (
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("size-3.5", i < r.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
                </div>
                {r.review && <p className="text-sm text-muted-foreground leading-relaxed">{r.review}</p>}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function InfluencerModal({
  influencer: initial,
  onClose,
}: {
  influencer: Influencer;
  onClose: () => void;
}) {
  const [inf, setInf] = useState(initial);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton
        className="max-w-5xl w-full p-0 gap-0 h-[88vh] flex flex-col overflow-hidden sm:max-w-5xl"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3 pr-8">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold leading-tight">{inf.name}</DialogTitle>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {inf.tier && (
                  <Badge variant={TIER_VARIANT[inf.tier] ?? "secondary"} className="capitalize text-xs">{inf.tier}</Badge>
                )}
                <Badge variant={STATUS_VARIANT[inf.status] ?? "secondary"} className="capitalize text-xs">{inf.status}</Badge>
                {inf.gender && <Badge variant="outline" className="capitalize text-xs">{fmt(inf.gender)}</Badge>}
                {inf.primaryNiche && <Badge variant="outline" className="text-xs">{inf.primaryNiche}</Badge>}
                {inf.primaryLocation && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />{inf.primaryLocation}
                  </span>
                )}
              </div>
            </div>

            {/* Cost pills */}
            <div className="flex gap-2 shrink-0">
              {[
                { label: "Brand", value: inf.brandCost },
                { label: "Net", value: inf.netCost },
                { label: "Gross", value: inf.grossCost },
              ].filter(c => c.value && c.value !== "0.00").map(({ label, value }) => (
                <div key={label} className="text-center rounded-lg bg-muted/50 px-3 py-1.5 min-w-[80px]">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold">{fmtNpr(value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="flex flex-col flex-1 min-h-0">
          <div className="px-6 border-b shrink-0">
            <TabsList variant="line" className="h-10 gap-0">
              <TabsTrigger value="details" className="px-4">Details</TabsTrigger>
              <TabsTrigger value="edit" className="px-4">Edit</TabsTrigger>
              <TabsTrigger value="reviews" className="px-4">Reviews</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 min-h-0 mt-0">
            <DetailsTab inf={inf} />
          </TabsContent>

          <TabsContent value="edit" className="flex-1 min-h-0 mt-0">
            <EditTab inf={inf} onSaved={setInf} />
          </TabsContent>

          <TabsContent value="reviews" className="flex-1 min-h-0 mt-0 flex flex-col">
            <ReviewsTab inf={inf} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
