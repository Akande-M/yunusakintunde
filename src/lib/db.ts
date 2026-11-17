import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loosely-typed handle on the same Supabase client.
 * The CMS tables are created by a migration, and Lovable regenerates
 * `integrations/supabase/types.ts` afterwards. This keeps the code compiling
 * before and after that regeneration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as unknown as SupabaseClient<any, "public", any>;

export const MEDIA_BUCKET = "media";
