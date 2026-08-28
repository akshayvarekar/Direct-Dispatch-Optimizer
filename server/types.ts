export interface Factory {
  Factory_ID: string;
  Factory_Name: string;
  Latitude: number;
  Longitude: number;
  Godown_Capacity_Pallets: number;
}

export interface DC {
  DC_ID: string;
  DC_Name: string;
  Latitude: number;
  Longitude: number;
  Godown_Capacity_Pallets: number;
}

export interface Customer {
  Customer_ID: string;
  Customer_Name: string;
  Latitude: number;
  Longitude: number;
  Primary_DC: string;
}

export interface SKUMaster {
  SKU_ID: string;
  SKU_Name: string;
  SKU_Hierarchy_L1: string;
  SKU_Hierarchy_L2: string;
}

export interface SalesOrder {
  Sales_Order: string;
  Line_Item: number;
  SKU_ID: string;
  SKU_Hierarchy_L1: string;
  Qty_Pallets: number;
  Customer_ID: string;
  DC_ID: string;
  Order_Generation_Date: string;
  Requested_Delivery_Date: string;
}

export interface STOData {
  Factory_ID: string;
  DC_ID: string;
  SKU_ID: string;
  STO_Number: string;
  Line_Item: number;
  Qty_Pallets: number;
  Execution_Date: string;
}

export interface PrimaryShipmentCost {
  Lane_Type: string;
  Factory_ID: string;
  DC_ID: string;
  Month: string;
  Total_Pallets_Shipped: number;
  Base_Cost: number;
  Fuel_Cost: number;
}

export interface SecondaryShipmentCost {
  Lane_Type: string;
  DC_ID: string;
  Customer_ID: string;
  Month: string;
  Total_Pallets_Shipped: number;
  Base_Cost: number;
  Fuel_Cost: number;
}

export interface WHFactoryCostMaster {
  Location_Type: 'Factory' | 'DC' | string;
  Location_ID: string;
  Handling_In_Cost_Per_Pallet: number;
  Handling_Out_Cost_Per_Pallet: number;
  Storage_Cost_Per_Pallet_Per_Week: number;
  Capacity_Pallets: number;
}

export interface ScenarioParameters {
  ScnName: string;
  MinTruckload: number;
  OrderCombHorizon: number; // 0, 3, 7
  MilkRuns: 'YES' | 'NO' | string;
  BOFWeight: number;
  LossWeight: number;
  BOFStockWeight: number;
  UseWHCapacityCons: 'YES' | 'NO' | string;
  DOH_BoF_weeks: number;
  DOH_DC_weeks: number;
}

export interface Dataset {
  factories: Factory[];
  dcs: DC[];
  customers: Customer[];
  skuMaster: SKUMaster[];
  salesOrders: SalesOrder[];
  stoData: STOData[];
  primaryCosts: PrimaryShipmentCost[];
  secondaryCosts: SecondaryShipmentCost[];
  whCosts: WHFactoryCostMaster[];
  scenarios: ScenarioParameters[];
  sourceName?: string;
  loadedAt?: string;
}

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

export interface AlphaEntry {
  factoryId: string;
  skuId: string;
  skuName?: string;
  alpha: number;
  totalStoPallets: number;
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
  totalUnprofitableDeclinedPallets?: number;
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
