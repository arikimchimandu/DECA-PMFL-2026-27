/* Centsible V4 — deployment settings.
 *
 * GitHub Pages has no server-side environment variables, so this file is the configuration.
 * To turn on shared impact data, create a Supabase project, run supabase/schema.sql, and paste:
 *   - the Project URL
 *   - the anon (public) key   ← safe to publish: the database only lets it ADD events, never read them.
 * NEVER paste the service_role key here.
 * Leave both blank and everything still works, with data saved on each device only.
 */
window.CENTSIBLE_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  table: 'v4_events',
  summaryFunction: 'v4_impact_summary',
};
