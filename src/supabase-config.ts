import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ktfnwdxrgdkrklctiexj.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_wOj6NbvDIrcM-Yt2pKbVAQ_xQJPXBP9";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
