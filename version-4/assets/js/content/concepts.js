/* Centspire V4 — the concept map that ties together questions, game decisions, lessons, and missions.
 * Every question, lesson, and mission is tagged with one or more of these concept IDs.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Concepts = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    'net-price': { topic: 'college', label: 'sticker price vs. net price' },
    'aid-types': { topic: 'college', label: 'grants, scholarships, and loan types' },
    'aid-offer': { topic: 'college', label: 'reading a financial aid offer' },
    'loan-interest': { topic: 'college', label: 'how student loan interest builds' },
    'fed-vs-private': { topic: 'college', label: 'federal vs. private student loans' },
    'opportunity-cost': { topic: 'college', label: 'opportunity cost' },
    '50-30-20': { topic: 'budgeting', label: 'the 50/30/20 budget guideline' },
    'needs-wants': { topic: 'budgeting', label: 'needs vs. wants' },
    'budget-balance': { topic: 'budgeting', label: 'balancing a monthly budget' },
    'unexpected-expense': { topic: 'budgeting', label: 'handling unexpected expenses' },
    'min-payment': { topic: 'credit', label: 'minimum payments and interest' },
    'apr': { topic: 'credit', label: 'APR and interest' },
    'utilization': { topic: 'credit', label: 'credit utilization' },
    'credit-score': { topic: 'credit', label: 'how credit scores work' },
    'high-cost-debt': { topic: 'credit', label: 'avoiding high-cost debt' },
    'loan-term': { topic: 'credit', label: 'loan length vs. total interest' },
    'emergency-fund': { topic: 'saving', label: 'emergency funds' },
    'compound-growth': { topic: 'saving', label: 'compound growth' },
    'saving-goals': { topic: 'saving', label: 'short- and long-term saving goals' },
    'risk-diversification': { topic: 'saving', label: 'risk and diversification' },
    'index-funds': { topic: 'saving', label: 'index funds and fees' },
    'employer-match': { topic: 'saving', label: 'retirement plans and employer matches' },
    'gross-net': { topic: 'income', label: 'gross vs. net pay' },
    'payroll': { topic: 'income', label: 'payroll taxes and paychecks' },
    'withholding': { topic: 'income', label: 'tax withholding and brackets' },
    'income-planning': { topic: 'income', label: 'comparing job offers and income planning' },
  };
});
