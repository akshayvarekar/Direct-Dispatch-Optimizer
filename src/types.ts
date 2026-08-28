export interface FactorySiteResult {
  factoryId: string;
  factoryName: string;
  capacityPallets: number;
  ddOrdersServed: number;
  ddPallets: number;
  traditionalPallets: number;
  totalOrdersEvaluated: number;
  lossesPallets: number;
  transportSavings: number;
  whSavings: number;
  totalSavings: number;
  fillRateLossPct: number;
  avgCapacityUtilPct: number;
  maxCapacityUtilPct: number;
  avgDailyBofStock: number;
  co2SavedKg: number;
}

export interface ScenarioParameters {
  ScnName: string;
  MinTruckload: number;
  OrderCombHorizon: number;
  MilkRuns: 'YES' | 'NO' | string;
  BOFWeight: number;
  LossWeight: number;
  BOFStockWeight: number;
  UseWHCapacityCons: 'YES' | 'NO' | string;
  DOH_BoF_weeks: number;
  DOH_DC_weeks: number;
  hasResult?: boolean;
  totalCostSavings?: number | null;
  totalDDPallets?: number | null;
  eligibleOrdersPct?: number | null;
  fillRateLossPct?: number | null;
}

export interface AlphaEntry {
  factoryId: string;
  skuId: string;
  skuName?: string;
  alpha: number;
  totalStoPallets: number;
}

export interface OrderEvaluationDetail {
  salesOrder: string;
  lineItem: number;
  customerId: string;
  customerName: string;
  skuId: string;
  skuName: string;
  qtyPallets: number;
  deliveryDate: string;
  groupCombinedQty: number;
  assignedFactoryId: string;
  assignedFactoryName: string;
  assignedDCId: string;
  assignedDCName: string;
  alpha: number;
  isEligible: boolean;
  dispatchedDD: boolean;
  ddDispatchedPallets: number;
  lossPallets: number;
  primaryDistKm: number;
  secondaryDistKm: number;
  ddDistKm: number;
  pcpp: number;
  scpp: number;
  ddcpp: number;
  dcWhCost: number;
  factoryWhCost: number;
  unitTransportSavings: number;
  unitWhSavings: number;
  unitTotalSavings: number;
  totalOrderSavings: number;
  co2SavedKg: number;
  rejectionReason?: string;
}

export interface DailyLedgerPoint {
  date: string;
  factoryId: string;
  bofStock: number;
  capacity: number;
  utilizationPct: number;
  inflow: number;
  dispatch: number;
}

export interface ScenarioRunResult {
  scenarioName: string;
  params: ScenarioParameters;
  score: number;
  feasible: boolean;
  totalOrdersEvaluated: number;
  eligibleOrdersCount: number;
  eligibleOrdersPct: number;
  eligiblePallets: number;
  totalDDPallets: number;
  totalTraditionalPallets: number;
  totalLossPallets: number;
  totalTransportSavings: number;
  totalWHSavings: number;
  totalCostSavings: number;
  totalCO2SavedKg: number;
  fillRateLossPct: number;
  overallAvgCapacityUtilPct: number;
  siteResults: FactorySiteResult[];
  alphaVector: AlphaEntry[];
  sampleOrders: OrderEvaluationDetail[];
  dailyLedgerSample: DailyLedgerPoint[];
  executionTimeMs: number;
}

export interface DatasetStatus {
  sourceName: string;
  loadedAt: string;
  counts: {
    factories: number;
    dcs: number;
    customers: number;
    skuMaster: number;
    salesOrders: number;
    stoData: number;
    primaryCosts: number;
    secondaryCosts: number;
    whCosts: number;
    scenarios: number;
  };
  cachedScenarioRuns: string[];
}
