import { createFileRoute } from "@tanstack/react-router";
import { Badge, Collection, PageTitle, type FieldDef } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/achievements")({
  component: AchievementsAdmin,
});

const FIELDS: FieldDef[] = [
  {
    name: "title",
    label: "Card title",
    type: "text",
    required: true,
    hint: "e.g. “Oyo East Local Government”",
  },
  {
    name: "zone",
    label: "Zone",
    type: "select",
    options: [
      { value: "Ibadan", label: "Ibadan" },
      { value: "Ogbomoso", label: "Ogbomoso" },
      { value: "Oyo", label: "Oyo" },
      { value: "Senate", label: "Senate (legislative duties)" },
    ],
  },
  {
    name: "heading",
    label: "List heading",
    type: "text",
    hint: "e.g. “10 major achievements” or “Sponsored bills”",
  },
  {
    name: "items",
    label: "Achievements",
    type: "lines",
    required: true,
    rows: 12,
    hint: "One per line. Numbers like 714 or ₦50,000 are bolded automatically, and an icon is picked from the wording.",
  },
  {
    name: "extra_heading",
    label: "Second list heading (optional)",
    type: "text",
    hint: "e.g. “Schools renovated” or “Motions”",
  },
  { name: "extra_items", label: "Second list", type: "lines", rows: 4 },
  { name: "published", label: "Show on website", type: "toggle" },
];

type Row = Record<string, unknown>;

function AchievementsAdmin() {
  return (
    <>
      <PageTitle
        title="Major achievements"
        sub="The homepage carousel, one card per local government. Cards slide right to left on their own; use the arrows here to set their order."
      />
      <Collection
        table="achievement_cards"
        noun="card"
        fields={FIELDS}
        defaults={{
          title: "",
          zone: "Oyo",
          heading: "10 major achievements",
          items: "",
          extra_heading: "",
          extra_items: "",
          published: true,
        }}
        summary={(r: Row) => {
          const n = Array.isArray(r["items"]) ? r["items"].length : 0;
          return {
            title: String(r["title"]),
            subtitle: `${n} item${n === 1 ? "" : "s"} · ${String(r["heading"] ?? "")}`,
            badge: (
              <Badge tone={r["zone"] === "Senate" ? "gold" : "green"}>{String(r["zone"])}</Badge>
            ),
          };
        }}
      />
    </>
  );
}
