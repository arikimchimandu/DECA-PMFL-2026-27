/* Centspire V5 — deployment settings.
 *
 * GitHub Pages has no server-side environment variables, so this file is the configuration.
 * Shared impact data, save codes, and team sign-in for the impact dashboard all use the Supabase project below.
 * Before they work, run supabase/schema.sql once in the Supabase SQL Editor (see README).
 *   - supabaseAnonKey is the anon (public) key — safe to publish: the database only lets it add
 *     events and use the save-code functions; it can never read other students' records.
 * NEVER paste the service_role key here.
 * Leave the URL and key blank and everything still works, with data saved on each device only.
 */
window.CENTSIBLE_CONFIG = {
  supabaseUrl: 'https://cqgejmzftifpiqsxpzdf.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZ2VqbXpmdGlmcGlxc3hwemRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTA0MzUsImV4cCI6MjEwNzQ2NjQzNX0.553Xvh1DujB379-0AAXWmqgsrTzocvG_d-KLxYhjYiU', // anon (public) key
  table: 'v5_events',
  summaryFunction: 'v5_impact_summary',

  // Who made Centspire (shown in the footer). Add a contact email to show a "Questions?" link.
  team: {
    creators: 'Ari, Dia, and Sanskriti',
    school: '',
    contact: '',
  },

  // Simulator rewards. Change the wording or thresholds once prizes are approved, or set enabled: false.
  rewards: {
    enabled: false,                   // rewards removed Oct 26 — set true (and fill in a prize) to bring them back
    accuracyThreshold: 0.95,          // more than 95% of answers correct…
    accuracyMinAnswers: 8,
    accuracyReward: '100 Centspire credit points',
    accuracyCredits: 100,
    scoreThreshold: 10000,            // Challenge Score over 10,000 (out of 13,000)…
    scoreReward: '',                  // prize for the score (leave '' for no score prize)
    claimNote: 'Show this code at the Centspire table to claim your reward. One reward of each kind per student, while supplies last.',
  },
};
