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
 * 1. Saves every sign-up to the `signups` table (visible in /admin → Sign-ups).
 * 2. Optionally forwards a copy to SIGNUP_WEBHOOK_URL (Mailchimp/Zapier/Sheets/CRM).
 * The visitor only sees success if at least one of the two actually stored it;
 * nothing is silently dropped any more.
 */
export const submitSignup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }) => {
    const submittedAt = new Date().toISOString();
    const payload = { ...data, source: "akintunde-2027-website", submittedAt };

    let saved = false;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabaseAdmin as any).from("signups").insert({
        full_name: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        lga_ward: data.lgaWard,
        intent: data.intent,
        message: data.message || null,
        consent: data.consent,
        source: payload.source,
      });
      if (error) throw error;
      saved = true;
    } catch (err) {
      console.error("[signup] database insert failed", err);
    }

    const webhook = process.env["SIGNUP_WEBHOOK_URL"];
    if (webhook) {
      try {
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`webhook responded ${res.status}`);
        saved = true;
      } catch (err) {
        console.error("[signup] webhook forward failed", err);
      }
    }

    if (!saved) {
      console.error("[signup] NOT STORED, payload:", payload);
      throw new Error("We couldn't submit your details. Please try again in a moment.");
    }
    return { ok: true as const };
  });
