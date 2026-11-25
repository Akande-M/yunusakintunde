import { ApcBadge } from "@/components/site/ApcBadge";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useSiteSettings } from "@/lib/use-settings";
import { signupSchema, submitSignup, type SignupInput } from "@/lib/signup.functions";
import { PageHeader, btn } from "@/components/site/ui";
import { getLgaContacts } from "@/lib/lga-contacts";
import { LgaContactsSection } from "@/components/site/LgaContactsSection";

export const Route = createFileRoute("/get-involved")({
  head: () => ({
    meta: [
      { title: "Get Involved: Join the Akintunde 2027 campaign | Oyo Central" },
      {
        name: "description",
        content:
          "Volunteer, get updates, report a constituency issue or host a town hall. Reach the Oyo Central constituency office of Senator Yunus Abiodun Akintunde, PhD.",
      },
      { property: "og:title", content: "Join the Akintunde 2027 campaign" },
      {
        property: "og:description",
        content: "Volunteer, sign up for updates, or contact the Oyo Central constituency office.",
      },
    ],
  }),
  loader: async () => ({ contacts: await getLgaContacts() }),
  component: GetInvolved,
});

const EMPTY: SignupInput = {
  fullName: "",
  email: "",
  phone: "",
  lgaWard: "",
  intent: "Get campaign & newsletter updates",
  message: "",
  consent: false as unknown as true,
};

const inputCls =
  "w-full rounded-sm border border-border bg-paper px-3.5 py-3 text-[14.5px] text-foreground placeholder:text-muted-foreground/70";

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-[12.5px] font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function GetInvolved() {
  const [values, setValues] = useState<SignupInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = useServerFn(submitSignup);
  const { contact } = useSiteSettings();
  const { contacts } = Route.useLoaderData();
  const CONTACT = [
    { icon: "✉", label: "Email", value: contact.email },
    { icon: "☎", label: "Phone", value: contact.phone },
    { icon: "⚑", label: "Constituency office", value: contact.office },
    { icon: "◷", label: "Office hours", value: contact.hours },
  ].filter((c) => c.value);

  const mutation = useMutation({
    mutationFn: (data: SignupInput) => submit({ data }),
    onSuccess: () => setValues(EMPTY),
  });

  const set = <K extends keyof SignupInput>(k: K, v: SignupInput[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data as SignupInput);
  }

  return (
    <>
      <PageHeader
        eyebrow="Get involved"
        title="Join the Akintunde 2027 campaign"
        lede="Volunteer, get campaign updates, support the re-election effort, or reach the constituency office directly."
      />

      <LgaContactsSection data={contacts} />

      <section className="py-12 sm:py-14">
        <div className="wrap grid items-start gap-12 lg:grid-cols-2">
          <div>
            <ApcBadge className="mb-6" />
            <ul>
              {CONTACT.map((c) => (
                <li key={c.label} className="flex gap-3.5 border-b border-border py-4">
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-tint text-primary"
                  >
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-sm">{c.label}</strong>
                    <span className="text-sm break-words text-muted-foreground">{c.value}</span>
                  </span>
                </li>
              ))}
            </ul>

            <a href="#signup" className={`${btn.gold} mt-7 w-full sm:w-auto`}>
              Volunteer for 2027
            </a>

            <p className="mt-5 text-[13px] text-muted-foreground">
              Prefer to support the campaign financially instead?{" "}
              <a href="#signup" className="font-semibold text-primary underline underline-offset-2">
                Learn how to contribute
              </a>
              .
            </p>
          </div>

          <div id="signup" className="border border-border bg-card p-6 sm:p-8">
            <h2 className="mb-5 text-[19px] font-semibold">Sign up to get involved</h2>

            {mutation.isSuccess ? (
              <div
                role="status"
                className="border-l-2 border-primary bg-primary-tint px-5 py-6 text-sm"
              >
                <p className="font-bold text-primary-deep">Thank you, you&apos;re signed up.</p>
                <p className="mt-1 text-muted-foreground">
                  The constituency office will be in touch. You can unsubscribe from updates at any
                  time.
                </p>
                <button
                  type="button"
                  onClick={() => mutation.reset()}
                  className="mt-4 cursor-pointer text-[13px] font-bold text-primary underline underline-offset-2"
                >
                  Submit another response
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <Field label="Full name" htmlFor="fullName" error={errors["fullName"]}>
                  <input
                    id="fullName"
                    className={inputCls}
                    value={values.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </Field>

                <div className="grid gap-x-3.5 sm:grid-cols-2">
                  <Field label="Email address" htmlFor="email" error={errors["email"]}>
                    <input
                      id="email"
                      type="email"
                      className={inputCls}
                      value={values.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Phone number" htmlFor="phone" error={errors["phone"]}>
                    <input
                      id="phone"
                      type="tel"
                      className={inputCls}
                      value={values.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+234"
                      autoComplete="tel"
                    />
                  </Field>
                </div>

                <Field label="LGA / Ward" htmlFor="lgaWard" error={errors["lgaWard"]}>
                  <input
                    id="lgaWard"
                    className={inputCls}
                    value={values.lgaWard}
                    onChange={(e) => set("lgaWard", e.target.value)}
                    placeholder="e.g. Akinyele, Ward 3"
                  />
                </Field>

                <Field label="I'd like to…" htmlFor="intent" error={errors["intent"]}>
                  <select
                    id="intent"
                    className={inputCls}
                    value={values.intent}
                    onChange={(e) => set("intent", e.target.value as SignupInput["intent"])}
                  >
                    <option>Get campaign &amp; newsletter updates</option>
                    <option>Volunteer</option>
                    <option>Report a constituency issue</option>
                    <option>Host a town hall in my ward</option>
                    <option>Share project testimonial</option>
                  </select>
                </Field>

                <Field label="Message (optional)" htmlFor="message" error={errors["message"]}>
                  <textarea
                    id="message"
                    rows={3}
                    className={inputCls}
                    value={values.message ?? ""}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="Tell us more"
                  />
                </Field>

                <label className="mb-2 flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={values.consent === true}
                    onChange={(e) => set("consent", e.target.checked as unknown as true)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="text-[12.5px] leading-relaxed">
                    I consent to receive campaign updates and newsletters by email and/or phone from
                    the Akintunde 2027 campaign, in line with the{" "}
                    <Link
                      to="/privacy"
                      className="font-bold text-primary underline underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    . I can unsubscribe at any time.
                  </span>
                </label>
                {errors["consent"] && (
                  <p role="alert" className="mb-3 text-[12.5px] font-semibold text-destructive">
                    {errors["consent"]}
                  </p>
                )}

                {mutation.isError && (
                  <p role="alert" className="mb-3 text-[13px] font-semibold text-destructive">
                    Something went wrong sending your details. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className={`${btn.primary} mt-3 w-full`}
                >
                  {mutation.isPending ? "Submitting…" : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
