/* Centspire V4 — deployment settings.
 *
 * GitHub Pages has no server-side environment variables, so this file is the configuration.
 * To turn on shared impact data, create a Supabase project, run supabase/schema.sql, and paste:
 *   - the Project URL
 *   - the anon (public) key   ← safe to publish: the database only lets it ADD events, never read them.
 * NEVER paste the service_role key here.
 * Leave both blank and everything still works, with data saved on each device only.
 */
window.CENTSIBLE_CONFIG = {
  supabaseUrl: 'https://cqgejmzftifpiqsxpzdf.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ2VqbXpmdGlmcGlxc3hwemRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTA0MzUsImV4cCI6MjEwNzQ2NjQzNX0.553Xvh1DujB379-0AAXWmqgsrTzocvG_d-KLxYhjYiU', // anon (public) key — insert-only by design
  table: 'v4_events',
  summaryFunction: 'v4_impact_summary',
};
