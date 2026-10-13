/* Centspire V4 — every important number in one place.
 *
 * Anything a student sees as a "real-world" figure comes from here, with its source.
 * Hypothetical game values are marked HYPOTHETICAL so nobody mistakes them for real offers.
 * Reviewers: check this file first.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Assumptions = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    asOf: '2026-27 school year',

    loans: {
      // Federal Student Aid: Direct Loans first disbursed July 1, 2025 – June 30, 2026.
      federalUndergradRate: 0.0639,
      parentPlusRate: 0.0894,
      // HYPOTHETICAL: private student loan rates depend on credit and vary widely (often ~4%–16%).
      privateRate: 0.095,
      // Federal Student Aid: annual limits for dependent undergraduates, years 1–4.
      dependentAnnualLimit: [5500, 6500, 7500, 7500],
      subsidizedAnnualLimit: [3500, 4500, 5500, 5500],
      standardTermYears: 10,
      extendedTermYears: 20,
      graceMonths: 6,
      // Simplification: origination fees (~1%) are ignored; unsubsidized/private interest that builds
      // during school and the grace period is added to the balance when repayment starts.
    },

    credit: {
      // Federal Reserve G.19: average card APR for accounts charged interest has been ~21–23%.
      // HYPOTHETICAL game card:
      cardApr: 0.24,
      cardLimit: 1000,
      securedLimit: 300,
      minPaymentPct: 0.02,   // HYPOTHETICAL: many cards use ~1% of balance + interest, or 2–3%
      minPaymentFloor: 25,
      utilizationGuide: 0.30, // common guidance: keep utilization under 30% (lower is better)
    },

    income: {
      // IRS Rev. Proc. 2025-32 (tax year 2026), single filer.
      standardDeduction: 16100,
      brackets: [
        { upTo: 12400, rate: 0.10 },
        { upTo: 50400, rate: 0.12 },
        { upTo: 105700, rate: 0.22 },
        { upTo: 201775, rate: 0.24 },
        { upTo: Infinity, rate: 0.32 }, // simplified: higher brackets not needed for this game
      ],
      ficaRate: 0.0765, // 6.2% Social Security + 1.45% Medicare
      // HYPOTHETICAL: state income tax varies from 0% to over 10%; we use a flat 4% to keep it simple.
      stateRate: 0.04,
      payPeriodsPerYear: 26,
      weeksPerMonth: 52 / 12,
      collegeHourlyWage: 15, // HYPOTHETICAL
      collegeNetFactor: 0.92, // HYPOTHETICAL: rough take-home after payroll taxes for a student job
    },

    saving: {
      emergencyMonthsLow: 3,
      emergencyMonthsHigh: 6,
      // HYPOTHETICAL illustration rate — NOT a prediction or guarantee. Investments can lose money.
      illustrativeReturn: 0.06,
      retirementAge: 65,
    },

    game: {
      startAge: 18,
      schoolMonthsPerYear: 9,
      familyContributionPerYear: 5000, // HYPOTHETICAL
      collegeAllowancePerMonth: 250,   // HYPOTHETICAL money from family during school
    },

    sources: [
      { id: 'fsa-rates', label: 'Federal Student Aid — Interest Rates for Direct Loans (2025–26)', url: 'https://studentaid.gov/understand-aid/types/loans/interest-rates' },
      { id: 'fsa-limits', label: 'Federal Student Aid — Annual and Aggregate Loan Limits', url: 'https://studentaid.gov/understand-aid/types/loans/subsidized-unsubsidized' },
      { id: 'irs-2026', label: 'IRS — Tax inflation adjustments for tax year 2026 (Rev. Proc. 2025-32)', url: 'https://www.irs.gov/newsroom' },
      { id: 'ssa-fica', label: 'Social Security Administration — Contribution and benefit base / FICA rates', url: 'https://www.ssa.gov/oact/cola/cbb.html' },
      { id: 'fed-g19', label: 'Federal Reserve — Consumer Credit (G.19), credit card interest rates', url: 'https://www.federalreserve.gov/releases/g19/current/' },
      { id: 'cb-pricing', label: 'College Board — Trends in College Pricing and Student Aid 2024', url: 'https://research.collegeboard.org/trends/college-pricing' },
      { id: 'cfpb-credit', label: 'CFPB — Credit reports and scores', url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/' },
      { id: 'acr', label: 'AnnualCreditReport.com — free credit reports', url: 'https://www.annualcreditreport.com/' },
      { id: 'sec-compound', label: 'Investor.gov (SEC) — Compound Interest Calculator and Investing Basics', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    ],
  };
});
