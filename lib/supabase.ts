import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vtbueznvfngltakpwjgb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0YnVlem52Zm5nbHRha3B3amdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTA4NDIsImV4cCI6MjA5MTE4Njg0Mn0.bKh_oZxLjqdQNV1sQ775nSGUh4t9mXgQU2K37FQlPgc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    detectSessionInUrl: true,
    flowType: "implicit",
  },
});
