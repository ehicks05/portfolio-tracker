const FEDERAL_DEDUCTION = 12550;
const STATE_DEDUCTION = 1000;

const FED_SCHEDULE = [
  [0, 9950, 0.1],
  [9951, 40525, 0.12],
  [40526, 86375, 0.22],
  [86376, 164925, 0.24],
  [164926, 209425, 0.32],
  [209426, 523600, 0.35],
  [523601, 900_000_000, 0.37],
];

const LONG_TERM_SCHEDULE = [
  [0, 40400, 0.0],
  [40401, 445850, 0.15],
  [445851, 900_000_000, 0.2],
];

const STATE_SCHEDULE = [
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

const calculateTaxes = ({
  shortTerm,
  longTerm,
}: {
  shortTerm: number;
  longTerm: number;
}) => {
  const income = shortTerm + longTerm;
  // state
  const stateTax = calculateTax(income - STATE_DEDUCTION, STATE_SCHEDULE);
  const stateTaxRate = stateTax / income;

  // federal
  const shortTermFederalIncome =
    shortTerm >= FEDERAL_DEDUCTION ? shortTerm - FEDERAL_DEDUCTION : 0;
  let remainingDeduction =
    shortTerm >= FEDERAL_DEDUCTION ? 0 : FEDERAL_DEDUCTION - shortTerm;

  const longTermFederalIncome =
    longTerm >= remainingDeduction ? longTerm - remainingDeduction : 0;

  const shortTermFedTax = calculateTax(shortTermFederalIncome, FED_SCHEDULE);
  const shortTermFedTaxRate = shortTermFedTax / shortTermFederalIncome;

  const adjustedLongTermSchedule = LONG_TERM_SCHEDULE.map((row) => [
    row[0] - shortTermFederalIncome,
    row[1] - shortTermFederalIncome,
    row[2],
  ]).filter((row) => row[1] !== 0);

  const longTermFedTax = calculateTax(
    longTermFederalIncome,
    adjustedLongTermSchedule
  );
  const longTermFedTaxRate = longTermFedTax / longTermFederalIncome;

  const federalTax = shortTermFedTax + longTermFedTax;
  const federalTaxRate = (shortTermFedTax + longTermFedTax) / income;

  const niit = longTerm > 200_000 ? (longTerm - 200_000) * 0.038 : 0;
  const niitRate = niit / longTerm;

  const overallTax = stateTax + federalTax + niit;
  const overallTaxRate = overallTax / income;

  const remaining = income - stateTax - shortTermFedTax - longTermFedTax - niit;

  return {
    stateTax,
    stateTaxRate,
    shortTermFedTax,
    shortTermFedTaxRate,
    longTermFedTax,
    longTermFedTaxRate,
    federalTax,
    federalTaxRate,
    overallTax,
    overallTaxRate,
    niit,
    niitRate,
    remaining,
  };
};

export { calculateTaxes };
