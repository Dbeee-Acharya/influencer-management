import { useState } from "react";
import { Download } from "lucide-react";
import type { Influencer } from "@/components/InfluencerModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// ── Field definitions ─────────────────────────────────────────────────────────

type FieldKey =
  | "tier" | "status" | "gender" | "familyStatus" | "contactNo"
  | "brandCost" | "netCost" | "grossCost"
  | "instagram" | "tiktok" | "facebook" | "youtube"
  | "primaryNiche" | "secondaryNiche" | "mainAgeGroup" | "personality"
  | "contentFrequency" | "contentQuality" | "videoStyle"
  | "responsiveness" | "availability" | "lifestyleTraits"
  | "primaryLocation" | "secondaryLocation" | "tertiaryLocation"
  | "description" | "bio";

interface FieldDef {
  key: FieldKey;
  label: string;
  defaultOn: boolean;
}

const FIELD_GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Identity",
    fields: [
      { key: "tier", label: "Tier", defaultOn: false },
      { key: "status", label: "Status", defaultOn: false },
      { key: "gender", label: "Gender", defaultOn: false },
      { key: "familyStatus", label: "Family Status", defaultOn: false },
      { key: "contactNo", label: "Contact No.", defaultOn: false },
    ],
  },
  {
    title: "Costs (NPR)",
    fields: [
      { key: "brandCost", label: "Brand Cost", defaultOn: true },
      { key: "netCost", label: "Net Cost", defaultOn: true },
      { key: "grossCost", label: "Gross Cost", defaultOn: true },
    ],
  },
  {
    title: "Socials",
    fields: [
      { key: "instagram", label: "Instagram (URL · Followers · Avg Views)", defaultOn: true },
      { key: "tiktok", label: "TikTok (URL · Followers · Avg Views)", defaultOn: true },
      { key: "facebook", label: "Facebook (URL · Followers · Avg Views)", defaultOn: true },
      { key: "youtube", label: "YouTube (URL · Subscribers · Avg Views)", defaultOn: true },
    ],
  },
  {
    title: "Content & Profile",
    fields: [
      { key: "primaryNiche", label: "Primary Niche", defaultOn: false },
      { key: "secondaryNiche", label: "Secondary Niche", defaultOn: false },
      { key: "mainAgeGroup", label: "Main Age Group", defaultOn: false },
      { key: "personality", label: "Personality", defaultOn: false },
      { key: "contentFrequency", label: "Content Frequency", defaultOn: false },
      { key: "contentQuality", label: "Content Quality", defaultOn: false },
      { key: "videoStyle", label: "Video Style", defaultOn: false },
      { key: "responsiveness", label: "Responsiveness", defaultOn: false },
      { key: "availability", label: "Availability", defaultOn: false },
      { key: "lifestyleTraits", label: "Lifestyle Traits", defaultOn: false },
    ],
  },
  {
    title: "Location",
    fields: [
      { key: "primaryLocation", label: "Primary Location", defaultOn: false },
      { key: "secondaryLocation", label: "Secondary Location", defaultOn: false },
      { key: "tertiaryLocation", label: "Tertiary Location", defaultOn: false },
    ],
  },
  {
    title: "About",
    fields: [
      { key: "description", label: "Description", defaultOn: false },
      { key: "bio", label: "Bio", defaultOn: false },
    ],
  },
];

const SOCIAL_PLATFORMS = ["instagram", "tiktok", "facebook", "youtube"] as const;

// ── CSV generation ────────────────────────────────────────────────────────────

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmt(s: string | null | undefined) {
  if (!s) return "";
  return s.replace(/_/g, " ");
}

function generateCSV(influencers: Influencer[], enabled: Set<FieldKey>): string {
  // Build header row
  const headers: string[] = ["Name"];

  if (enabled.has("tier")) headers.push("Tier");
  if (enabled.has("status")) headers.push("Status");
  if (enabled.has("gender")) headers.push("Gender");
  if (enabled.has("familyStatus")) headers.push("Family Status");
  if (enabled.has("contactNo")) headers.push("Contact No.");
  if (enabled.has("brandCost")) headers.push("Brand Cost (NPR)");
  if (enabled.has("netCost")) headers.push("Net Cost (NPR)");
  if (enabled.has("grossCost")) headers.push("Gross Cost (NPR)");

  for (const platform of SOCIAL_PLATFORMS) {
    if (enabled.has(platform)) {
      const label = platform === "youtube" ? "YouTube" : platform.charAt(0).toUpperCase() + platform.slice(1);
      headers.push(`${label} URL`, `${label} Followers`, `${label} Avg Views`);
    }
  }

  if (enabled.has("primaryNiche")) headers.push("Primary Niche");
  if (enabled.has("secondaryNiche")) headers.push("Secondary Niche");
  if (enabled.has("mainAgeGroup")) headers.push("Main Age Group");
  if (enabled.has("personality")) headers.push("Personality");
  if (enabled.has("contentFrequency")) headers.push("Content Frequency");
  if (enabled.has("contentQuality")) headers.push("Content Quality");
  if (enabled.has("videoStyle")) headers.push("Video Style");
  if (enabled.has("responsiveness")) headers.push("Responsiveness");
  if (enabled.has("availability")) headers.push("Availability");
  if (enabled.has("lifestyleTraits")) headers.push("Lifestyle Traits");
  if (enabled.has("primaryLocation")) headers.push("Primary Location");
  if (enabled.has("secondaryLocation")) headers.push("Secondary Location");
  if (enabled.has("tertiaryLocation")) headers.push("Tertiary Location");
  if (enabled.has("description")) headers.push("Description");
  if (enabled.has("bio")) headers.push("Bio");

  // Build data rows
  const rows = influencers.map((inf) => {
    const row: string[] = [csvCell(inf.name)];

    if (enabled.has("tier")) row.push(csvCell(inf.tier));
    if (enabled.has("status")) row.push(csvCell(inf.status));
    if (enabled.has("gender")) row.push(csvCell(fmt(inf.gender)));
    if (enabled.has("familyStatus")) row.push(csvCell(inf.familyStatus));
    if (enabled.has("contactNo")) row.push(csvCell(inf.contactNo));
    if (enabled.has("brandCost")) row.push(csvCell(inf.brandCost ? Number(inf.brandCost) : ""));
    if (enabled.has("netCost")) row.push(csvCell(inf.netCost ? Number(inf.netCost) : ""));
    if (enabled.has("grossCost")) row.push(csvCell(inf.grossCost ? Number(inf.grossCost) : ""));

    for (const platform of SOCIAL_PLATFORMS) {
      if (enabled.has(platform)) {
        const s = inf.socials.find((x) => x.platform === platform);
        row.push(csvCell(s?.profileUrl ?? ""));
        row.push(csvCell(s?.followers ?? ""));
        row.push(csvCell(s?.avgViews ?? ""));
      }
    }

    if (enabled.has("primaryNiche")) row.push(csvCell(inf.primaryNiche));
    if (enabled.has("secondaryNiche")) row.push(csvCell(inf.secondaryNiche));
    if (enabled.has("mainAgeGroup")) row.push(csvCell(inf.mainAgeGroup));
    if (enabled.has("personality")) row.push(csvCell(inf.personality));
    if (enabled.has("contentFrequency")) row.push(csvCell(fmt(inf.contentFrequency)));
    if (enabled.has("contentQuality")) row.push(csvCell(inf.contentQuality));
    if (enabled.has("videoStyle")) row.push(csvCell(inf.videoStyle));
    if (enabled.has("responsiveness")) row.push(csvCell(fmt(inf.responsiveness)));
    if (enabled.has("availability")) row.push(csvCell(inf.availability));
    if (enabled.has("lifestyleTraits")) row.push(csvCell(inf.lifestyleTraits));
    if (enabled.has("primaryLocation")) row.push(csvCell(inf.primaryLocation));
    if (enabled.has("secondaryLocation")) row.push(csvCell(inf.secondaryLocation));
    if (enabled.has("tertiaryLocation")) row.push(csvCell(inf.tertiaryLocation));
    if (enabled.has("description")) row.push(csvCell(inf.description));
    if (enabled.has("bio")) row.push(csvCell(inf.bio));

    return row.join(",");
  });

  return [headers.map(csvCell).join(","), ...rows].join("\n");
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExportModal({
  influencers,
  onClose,
}: {
  influencers: Influencer[];
  onClose: () => void;
}) {
  const defaultEnabled = new Set<FieldKey>(
    FIELD_GROUPS.flatMap((g) => g.fields.filter((f) => f.defaultOn).map((f) => f.key))
  );
  const [enabled, setEnabled] = useState<Set<FieldKey>>(defaultEnabled);

  function toggle(key: FieldKey) {
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleGroup(fields: FieldDef[]) {
    const allOn = fields.every((f) => enabled.has(f.key));
    setEnabled((prev) => {
      const next = new Set(prev);
      fields.forEach((f) => (allOn ? next.delete(f.key) : next.add(f.key)));
      return next;
    });
  }

  function handleExport() {
    const csv = generateCSV(influencers, enabled);
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `influencers-${date}.csv`);
    onClose();
  }

  const totalCols =
    enabled.size +
    [...enabled].filter((k) => SOCIAL_PLATFORMS.includes(k as typeof SOCIAL_PLATFORMS[number])).length * 2; // each platform = 3 cols

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-0 gap-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle>Export {influencers.length} influencer{influencers.length !== 1 ? "s" : ""} as CSV</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Name is always included. Choose additional fields below.
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] px-6 py-4 space-y-5">
          {/* Always-on field */}
          <div className="flex items-center gap-2 text-sm">
            <Checkbox checked disabled className="opacity-60" />
            <span className="font-medium">Name</span>
            <span className="text-xs text-muted-foreground ml-auto">always included</span>
          </div>

          <Separator />

          {FIELD_GROUPS.map((group) => {
            const allOn = group.fields.every((f) => enabled.has(f.key));
            const someOn = group.fields.some((f) => enabled.has(f.key));

            return (
              <div key={group.title} className="space-y-2">
                {/* Group header with toggle-all */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {group.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.fields)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    {allOn ? "Deselect all" : someOn ? "Select all" : "Select all"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {group.fields.map((field) => (
                    <label
                      key={field.key}
                      className="flex items-center gap-2.5 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={enabled.has(field.key)}
                        onCheckedChange={() => toggle(field.key)}
                      />
                      <span className="text-sm">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-row items-center justify-between sm:justify-between">
          <p className="text-xs text-muted-foreground">
            ~{totalCols + 1} columns · {influencers.length} rows
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleExport} disabled={enabled.size === 0}>
              <Download className="size-3.5 mr-1.5" />
              Download CSV
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
