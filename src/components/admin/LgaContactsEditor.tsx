import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ZONES } from "@/lib/lgas";
import {
  formatPhone,
  getLgaContacts,
  saveLgaContacts,
  type LgaContact,
  type LgaContacts,
} from "@/lib/lga-contacts";
import { abtn, Card, errMsg, Field, inputCls } from "./kit";

const blank = (lga: string): LgaContact => ({
  name: "",
  role: "",
  note: "",
  phone: "",
  lgas: lga ? [lga] : [],
});

/** Admin → Site content → Local contacts: the "Contact Us" list on the Get Involved page. */
export function LgaContactsEditor() {
  const [data, setData] = useState<LgaContacts | null>(null);
  const [filter, setFilter] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => void getLgaContacts().then(setData), []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  if (!data) return null;

  const update = (next: LgaContacts) => {
    setData(next);
    setDirty(true);
  };
  const setPerson = (i: number, patch: Partial<LgaContact>) =>
    update({ ...data, people: data.people.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const move = (i: number, d: -1 | 1) => {
    const people = [...data.people];
    const j = i + d;
    if (j < 0 || j >= people.length) return;
    [people[i], people[j]] = [people[j]!, people[i]!];
    update({ ...data, people });
  };

  async function save() {
    if (!data) return;
    const bad = data.people.find((p) => !p.lgas.length);
    if (bad) {
      toast.error(`Choose at least one local government for ${bad.name || "every person"}.`);
      return;
    }
    setSaving(true);
    try {
      await saveLgaContacts({
        ...data,
        people: data.people.filter((p) => p.name.trim() || p.phone.trim()),
      });
      setDirty(false);
      toast.success("Saved. It’s live on the Get Involved page");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  const shown = data.people
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !filter || p.lgas.includes(filter));

  return (
    <>
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold">Contact Us (Get Involved page)</h2>
          <a
            href="/get-involved#contact-us"
            target="_blank"
            rel="noreferrer"
            className={abtn.outline}
          >
            View on site <ExternalLink className="size-4" />
          </a>
        </div>
        <Field label="Heading">
          <input
            className={inputCls}
            value={data.heading}
            onChange={(e) => update({ ...data, heading: e.target.value })}
          />
        </Field>
        <Field label="Intro text">
          <textarea
            className={inputCls}
            rows={2}
            value={data.intro}
            onChange={(e) => update({ ...data, intro: e.target.value })}
          />
        </Field>
      </Card>

      <Card className="mt-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold">People ({data.people.length})</h2>
            <p className="text-[13px] text-muted-foreground">
              Tick every local government a person covers; they appear under each of those tabs.
              Within a tab, CRC is listed first, then LOs, then SAs.
            </p>
          </div>
          <label className="text-[13px] font-semibold">
            Show{" "}
            <select
              className={`${inputCls} inline-block w-auto py-1.5`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Everyone</option>
              {ZONES.map((z) => (
                <optgroup key={z.zone} label={`${z.zone} zone`}>
                  {z.lgas.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <datalist id="contact-roles">
          <option value="CRC" />
          <option value="LO" />
          <option value="SA" />
        </datalist>

        <ul className="space-y-3">
          {shown.map(({ p, i }) => (
            <li key={i} className="rounded-sm border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-[1.4fr_.5fr_1fr]">
                <input
                  className={inputCls}
                  placeholder="Full name"
                  aria-label="Full name"
                  value={p.name}
                  onChange={(e) => setPerson(i, { name: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Role (CRC, LO, SA)"
                  aria-label="Role"
                  list="contact-roles"
                  value={p.role}
                  onChange={(e) => setPerson(i, { role: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Phone, e.g. 0803 000 0000"
                  aria-label="Phone"
                  inputMode="tel"
                  value={p.phone}
                  onChange={(e) => setPerson(i, { phone: e.target.value })}
                  onBlur={(e) => setPerson(i, { phone: formatPhone(e.target.value) })}
                />
              </div>
              <input
                className={`${inputCls} mt-2`}
                placeholder="Note under the name (optional), e.g. Oyo zone and Ogbomoso"
                aria-label="Note"
                value={p.note}
                onChange={(e) => setPerson(i, { note: e.target.value })}
              />
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {ZONES.map((z) => (
                  <div key={z.zone} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      {z.zone}
                    </span>
                    {z.lgas.map((l) => {
                      const on = p.lgas.includes(l);
                      return (
                        <button
                          key={l}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setPerson(i, {
                              lgas: on ? p.lgas.filter((x) => x !== l) : [...p.lgas, l],
                            })
                          }
                          className={`min-h-8 cursor-pointer rounded-full border px-2.5 text-[12.5px] font-semibold ${
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary"
                          }`}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                ))}
                <div className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    className={abtn.icon}
                    aria-label="Move up"
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={abtn.icon}
                    aria-label="Move down"
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={abtn.icon}
                    aria-label={`Remove ${p.name || "this person"}`}
                    onClick={() =>
                      update({ ...data, people: data.people.filter((_, j) => j !== i) })
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <button
            type="button"
            className={abtn.outline}
            onClick={() => update({ ...data, people: [...data.people, blank(filter)] })}
          >
            <Plus className="size-4" /> Add a person{filter ? ` in ${filter}` : ""}
          </button>
          <button
            type="button"
            className={abtn.primary}
            disabled={saving || !dirty}
            onClick={() => void save()}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </Card>
    </>
  );
}
