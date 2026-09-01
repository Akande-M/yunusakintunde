import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(25)
    .regex(/^[0-9+()\-\s]+$/, "Enter a valid phone number"),
  lgaWard: z.string().trim().min(2, "Tell us your LGA or ward").max(120),
  intent: z.enum([
    "Get campaign & newsletter updates",
    "Volunteer",
    "Report a constituency issue",
    "Host a town hall in my ward",
  ]),
  message: z.string().trim().max(1000).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please confirm your consent to continue" }),
  }),
});

export type SignupInput = z.input<typeof signupSchema>;

/**
 * Single write point for supporter sign-ups.
 * Set SIGNUP_WEBHOOK_URL (Mailchimp/Zapier/Google Sheet/CRM endpoint) to forward
 * submissions; until then, entries are logged server-side.
 */
export const submitSignup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }) => {
    const webhook = process.env["SIGNUP_WEBHOOK_URL"];
    const payload = { ...data, source: "akintunde-2027-website", submittedAt: new Date().toISOString() };

    if (webhook) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("We couldn't submit your details. Please try again.");
    } else {
      console.info("[signup] no SIGNUP_WEBHOOK_URL configured; received:", payload);
    }

    return { ok: true as const };
  });
