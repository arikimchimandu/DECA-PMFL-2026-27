/* centsible. — settings.
 *
 * Shared data (optional): to combine results from every student's phone, create a free Supabase
 * project, run the SQL in README.md, then paste the project URL and anon (public) key below.
 * Leave them blank and the game still works — data is saved on each device only.
 */
window.CENTSIBLE_CONFIG = {
  supabaseUrl: '',      // e.g. 'https://abcdxyz.supabase.co'
  supabaseAnonKey: '',  // the "anon public" key — never the service_role key
  table: 'events',
};
