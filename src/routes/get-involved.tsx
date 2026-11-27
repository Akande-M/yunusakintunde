import { ApcBadge } from "@/components/site/ApcBadge";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useSiteSettings } from "@/lib/use-settings";
import { signupSchema, submitSignup, type SignupInput } from "@/lib/signup.functions";
import { btn } from "@/components/site/ui";
import { getLgaContacts } from "@/lib/lga-contacts";
import { LgaContactsSection } from "@/components/site/LgaContactsSection";

export const Route = createFileRoute("/get-involved")({
  head: () => ({
    meta: [
      { title: "Get in Touch: Contact the Senator's Office | Oyo Central" },
      {
        name: "description",
        content:
          "Contact the office of Senator Dr Yunus Abiodun Akintunde: the senatorial office, the liaison officers in your local government, and an enquiry form.",
      },
      { property: "og:title", content: "Contact the Senator's Office" },
      {
        property: "og:description",
        content: "Send an enquiry or reach the liaison officers in your local government.",
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
  intent: "Constituency enquiry",
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
  // A placeholder phone number (e.g. 0800 000 0000) is never shown.
  const phone = /000\s*0000|\[[^\]]*\]/.test(contact.phone) ? "" : contact.phone;
  const CONTACT = [
    { icon: "⚑", label: "Senatorial office", value: contact.office },
    { icon: "✉", label: "Official email", value: contact.email },
    { icon: "☎", label: "Office telephone", value: phone },
    { icon: "◷", label: "Opening days and hours", value: contact.hours },
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
      <LgaContactsSection data={contacts} />

      <section className="py-12 sm:py-14">
        <div className="wrap grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col">
            <h2 className="mb-4 font-serif text-[24px] font-semibold sm:text-[28px]">
              Contact the Senator’s office
            </h2>
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

            <div className="mt-auto pt-7">
              <a href="#signup" className={`${btn.gold} w-full sm:w-auto`}>
                Send an enquiry
              </a>
              <p className="mt-5 text-[13px] text-muted-foreground">
                For matters in your local government, you can also contact the liaison officers
                listed above.
              </p>
            </div>
          </div>

          <div id="signup" className="border border-border bg-card p-6 sm:p-8">
            <h2 className="mb-5 text-[19px] font-semibold">Send an enquiry</h2>

            {mutation.isSuccess ? (
              <div
                role="status"
                className="border-l-2 border-primary bg-primary-tint px-5 py-6 text-sm"
              >
                <p className="font-bold text-primary-deep">
                  Thank you, your message has been sent.
                </p>
                <p className="mt-1 text-muted-foreground">The Senator’s office will be in touch.</p>
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

                <Field label="Subject" htmlFor="intent" error={errors["intent"]}>
                  <select
                    id="intent"
                    className={inputCls}
                    value={values.intent}
                    onChange={(e) => set("intent", e.target.value as SignupInput["intent"])}
                  >
                    <option>Constituency enquiry</option>
                    <option>Report a constituency issue</option>
                    <option>Project or community development request</option>
                    <option>Legislative or policy submission</option>
                    <option>Invitation or official correspondence</option>
                    <option>Media enquiry</option>
                    <option>General feedback</option>
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
                    I agree that the office of Senator Akintunde may contact me by email or phone
                    about my enquiry, in line with the{" "}
                    <Link
                      to="/privacy"
                      className="font-bold text-primary underline underline-offset-2"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                {errors["consent"] && (
                  <p role="alert" className="mb-3 text-[12.5px] font-semibold text-destructive">
                    {errors["consent"]}
                  </p>
                )}

                {mutation.isError && (
                  <p role="alert" className="mb-3 text-[13px] font-semibold text-destructive">
                    Something went wrong sending your message. Please try again.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className={`${btn.primary} mt-3 w-full`}
                >
                  {mutation.isPending ? "Sending…" : "Send enquiry"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
