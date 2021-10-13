const FEDERAL_DEDUCTION = 12550;
const STATE_DEDUCTION = 1000;

const federal = [
  [0, 9950, 0.1],
  [9951, 40525, 0.12],
  [40526, 86375, 0.22],
  [86376, 164925, 0.24],
  [164926, 209425, 0.32],
  [209426, 523600, 0.35],
  [523601, 900_000_000, 0.37],
];

// Up to $40,400	$40,401 – $445,850	Over $445,850
const longTerm = [
  [0, 40400, 0.0],
  [40401, 445850, 0.15],
  [445851, 900_000_000, 0.2],
];

const state = [
  [0, 20000, 0.014],
  [20001, 35000, 0.0175],
  [35001, 40000, 0.035],
  [40001, 75000, 0.05525],
  [75001, 500_000, 0.0637],
  [500_001, 5_000_000, 0.0897],
  [5_000_001, 900_000_000, 0.1075],
];

const calculateTax = (income: number, schedule: any) => {
  let totalTaxes = 0;
  for (const interval of schedule) {
    if (income < interval[1]) {
      totalTaxes += (income - interval[0]) * interval[2];
      break;
    } else {
      totalTaxes += (interval[1] - interval[0]) * interval[2];
    }
  }
  return totalTaxes;
};

const calculateStateTax = (income: number) =>
  calculateTax(income - STATE_DEDUCTION, state);
const calculateFederalTax = (income: number) =>
  calculateTax(income - FEDERAL_DEDUCTION, federal);
const calculateLongTermTax = (income: number) =>
  calculateTax(income - FEDERAL_DEDUCTION, longTerm);
const calculateCombinedTax = (income: number) =>
  calculateFederalTax(income) + calculateStateTax(income);

export {
  FEDERAL_DEDUCTION,
  calculateCombinedTax,
  calculateFederalTax,
  calculateLongTermTax,
  calculateStateTax,
};
