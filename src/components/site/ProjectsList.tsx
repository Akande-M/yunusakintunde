import { useState } from "react";
import { PROJECT_REGIONS, type Project } from "@/lib/site-data";
import { Chip, SmartImage } from "./ui";

/* Community projects with a zone filter. Edited in Admin → Record & Agenda → Projects. */
export function ProjectsList({ projects }: { projects: Project[] }) {
  const [region, setRegion] = useState<(typeof PROJECT_REGIONS)[number]>("All regions");
  const shown = projects.filter((p) => region === "All regions" || p.region === region);
  return (
    <>
      <div className="mb-7 flex flex-wrap gap-2.5">
        {PROJECT_REGIONS.map((r) => (
          <Chip key={r} active={region === r} onClick={() => setRegion(r)}>
            {r}
          </Chip>
        ))}
      </div>
      <ul className="grid gap-8 md:grid-cols-2">
        {shown.map((p) => (
          <li key={p.name} className="rise-in border border-border bg-card">
            <SmartImage src={p.image} alt={p.alt} className="border-b border-border" />
            <div className="px-5 py-5">
              <h3 className="font-sans text-[15.5px] font-bold text-primary">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.place}</p>
              <p className="mt-2 text-[13px] font-semibold text-accent-deep">{p.completed}</p>
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="text-sm text-muted-foreground">No projects listed for this zone yet.</p>
      )}
    </>
  );
}
