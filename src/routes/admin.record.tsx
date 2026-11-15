import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Collection, PageTitle, type FieldDef } from "@/components/admin/kit";
import { StatusStamp } from "@/components/site/StatusStamp";

export const Route = createFileRoute("/admin/record")({
  component: RecordAdmin,
});

const STATUS = [
  { value: "delivered", label: "Delivered" },
  { value: "progress", label: "In progress" },
  { value: "upcoming", label: "Upcoming" },
] as const;

const COMMITMENT_FIELDS: FieldDef[] = [
  { name: "title", label: "Commitment", type: "text", required: true },
  {
    name: "detail",
    label: "Detail / evidence",
    type: "textarea",
    rows: 2,
    hint: "One line of proof, e.g. “Commissioned March 2025 in Iroko”.",
  },
  { name: "status", label: "Status", type: "select", options: STATUS },
  {
    name: "status_label",
    label: "Custom stamp text (optional)",
    type: "text",
    hint: "Overrides the stamp wording, e.g. “2027 pledge”.",
  },
  { name: "published", label: "Show on website", type: "toggle" },
];

const PROJECT_FIELDS: FieldDef[] = [
  { name: "name", label: "Project name", type: "text", required: true },
  {
    name: "place",
    label: "Location",
    type: "text",
    hint: "e.g. “Iroko Community, Akinyele LG · Ward 4”",
  },
  {
    name: "region",
    label: "Zone (used for the filter)",
    type: "select",
    options: ["Ibadan", "Oyo", "Ogbomoso", "Others"].map((r) => ({ value: r, label: r })),
  },
  {
    name: "completed_label",
    label: "Completion note",
    type: "text",
    hint: "e.g. “Commissioned March 2025”",
  },
  { name: "image_url", label: "Photo", type: "image", folder: "projects" },
  { name: "alt", label: "Describe the photo", type: "text" },
  {
    name: "night",
    label: "Night-time photo",
    type: "toggle",
    hint: "Tick if the photo was taken at night.",
  },
  { name: "published", label: "Show on website", type: "toggle" },
];

type Row = Record<string, unknown>;

const TABS = [
  ["kept", "2023 promises"],
  ["agenda", "2027 agenda"],
  ["projects", "Projects"],
] as const;

function RecordAdmin() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("kept");

  return (
    <>
      <PageTitle
        title="Record & Agenda"
        sub="The promise tracker updates the “x of y promises kept” counts on the site automatically."
      />
      <div role="tablist" className="mb-5 inline-flex rounded-sm border border-border bg-card p-1">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-9 rounded-sm px-4 text-[13px] font-bold ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "projects" ? (
        <Collection
          key="projects"
          table="projects"
          noun="project"
          fields={PROJECT_FIELDS}
          defaults={{
            name: "",
            place: "",
            region: "Oyo",
            completed_label: "",
            image_url: null,
            alt: "",
            night: false,
            published: true,
          }}
          summary={(r: Row) => ({
            title: String(r["name"]),
            subtitle: `${String(r["place"] ?? "")} · ${String(r["completed_label"] ?? "")}`,
            image: (r["image_url"] as string | null) ?? null,
            badge: <Badge>{String(r["region"])}</Badge>,
          })}
        />
      ) : (
        <Collection
          key={tab}
          table="commitments"
          match={{ list: tab }}
          noun={tab === "kept" ? "promise" : "agenda item"}
          fields={COMMITMENT_FIELDS}
          defaults={{
            title: "",
            detail: "",
            status: tab === "kept" ? "progress" : "upcoming",
            status_label: tab === "agenda" ? "2027 pledge" : "",
            published: true,
          }}
          summary={(r: Row) => ({
            title: String(r["title"]),
            subtitle: String(r["detail"] ?? ""),
            badge: (
              <StatusStamp
                status={r["status"] as "delivered" | "progress" | "upcoming"}
                {...(r["status_label"] ? { label: String(r["status_label"]) } : {})}
              />
            ),
          })}
        />
      )}
    </>
  );
}
