export interface Holding {
  symbol: string;
  quantity: number;
  costBasis?: number;
  shortTerm?: number;
  latestPrice?: string;
}

export interface Account {
  holdings: Holding[];
  label: string;
  crypto?: boolean;
  roth?: boolean;
}

export interface Portfolio {
  accounts: Account[];
}

export interface Quote {
  symbol: string;
  latestPrice: string;
  companyName?: string;
}

export type Quotes = Record<string, { quote: Quote }>;
