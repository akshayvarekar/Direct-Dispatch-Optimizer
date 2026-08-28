import {
  Dataset,
  Factory,
  DC,
  Customer,
  SKUMaster,
  SalesOrder,
  STOData,
  PrimaryShipmentCost,
  SecondaryShipmentCost,
  WHFactoryCostMaster,
  ScenarioParameters,
} from './types.js';

export function generateSyntheticDataset(): Dataset {
  const factories: Factory[] = [
    { Factory_ID: 'FAC-01', Factory_Name: 'Factory 1', Latitude: 28.6139, Longitude: 77.2090, Godown_Capacity_Pallets: 2200 },
    { Factory_ID: 'FAC-02', Factory_Name: 'Factory 2', Latitude: 18.5204, Longitude: 73.8567, Godown_Capacity_Pallets: 1800 },
    { Factory_ID: 'FAC-03', Factory_Name: 'Factory 3', Latitude: 13.0827, Longitude: 80.2707, Godown_Capacity_Pallets: 2500 },
    { Factory_ID: 'FAC-04', Factory_Name: 'Factory 4', Latitude: 22.5726, Longitude: 88.3639, Godown_Capacity_Pallets: 1500 },
    { Factory_ID: 'FAC-05', Factory_Name: 'Factory 5', Latitude: 21.1458, Longitude: 79.0882, Godown_Capacity_Pallets: 1200 },
  ];

  const dcs: DC[] = [
    { DC_ID: 'DC-01', DC_Name: 'DC 1', Latitude: 28.4595, Longitude: 77.0266, Godown_Capacity_Pallets: 15000 },
    { DC_ID: 'DC-02', DC_Name: 'DC 2', Latitude: 19.2967, Longitude: 73.0631, Godown_Capacity_Pallets: 18000 },
    { DC_ID: 'DC-03', DC_Name: 'DC 3', Latitude: 12.9716, Longitude: 77.5946, Godown_Capacity_Pallets: 14000 },
    { DC_ID: 'DC-04', DC_Name: 'DC 4', Latitude: 17.3850, Longitude: 78.4867, Godown_Capacity_Pallets: 12000 },
    { DC_ID: 'DC-05', DC_Name: 'DC 5', Latitude: 22.6841, Longitude: 88.2917, Godown_Capacity_Pallets: 11000 },
    { DC_ID: 'DC-06', DC_Name: 'DC 6', Latitude: 23.0225, Longitude: 72.5714, Godown_Capacity_Pallets: 10000 },
  ];

  const customers: Customer[] = [
    { Customer_ID: 'CUST-101', Customer_Name: 'Customer 101', Latitude: 28.5355, Longitude: 77.3910, Primary_DC: 'DC-01' },
    { Customer_ID: 'CUST-102', Customer_Name: 'Customer 102', Latitude: 28.4089, Longitude: 77.3178, Primary_DC: 'DC-01' },
    { Customer_ID: 'CUST-103', Customer_Name: 'Customer 103', Latitude: 28.6692, Longitude: 77.4538, Primary_DC: 'DC-01' },
    { Customer_ID: 'CUST-104', Customer_Name: 'Customer 104', Latitude: 26.9124, Longitude: 75.7873, Primary_DC: 'DC-01' },
    { Customer_ID: 'CUST-105', Customer_Name: 'Customer 105', Latitude: 30.7333, Longitude: 76.7794, Primary_DC: 'DC-01' },

    { Customer_ID: 'CUST-201', Customer_Name: 'Customer 201', Latitude: 19.2183, Longitude: 72.9781, Primary_DC: 'DC-02' },
    { Customer_ID: 'CUST-202', Customer_Name: 'Customer 202', Latitude: 19.0330, Longitude: 73.0297, Primary_DC: 'DC-02' },
    { Customer_ID: 'CUST-203', Customer_Name: 'Customer 203', Latitude: 19.9975, Longitude: 73.7898, Primary_DC: 'DC-02' },
    { Customer_ID: 'CUST-204', Customer_Name: 'Customer 204', Latitude: 19.2437, Longitude: 73.1355, Primary_DC: 'DC-02' },

    { Customer_ID: 'CUST-301', Customer_Name: 'Customer 301', Latitude: 12.9698, Longitude: 77.7500, Primary_DC: 'DC-03' },
    { Customer_ID: 'CUST-302', Customer_Name: 'Customer 302', Latitude: 12.8399, Longitude: 77.6770, Primary_DC: 'DC-03' },
    { Customer_ID: 'CUST-303', Customer_Name: 'Customer 303', Latitude: 12.2958, Longitude: 76.6394, Primary_DC: 'DC-03' },
    { Customer_ID: 'CUST-304', Customer_Name: 'Customer 304', Latitude: 11.0168, Longitude: 76.9558, Primary_DC: 'DC-03' },

    { Customer_ID: 'CUST-401', Customer_Name: 'Customer 401', Latitude: 17.4401, Longitude: 78.3489, Primary_DC: 'DC-04' },
    { Customer_ID: 'CUST-402', Customer_Name: 'Customer 402', Latitude: 17.4399, Longitude: 78.4983, Primary_DC: 'DC-04' },
    { Customer_ID: 'CUST-403', Customer_Name: 'Customer 403', Latitude: 17.9689, Longitude: 79.5941, Primary_DC: 'DC-04' },

    { Customer_ID: 'CUST-501', Customer_Name: 'Customer 501', Latitude: 22.5958, Longitude: 88.2636, Primary_DC: 'DC-05' },
    { Customer_ID: 'CUST-502', Customer_Name: 'Customer 502', Latitude: 22.5867, Longitude: 88.4178, Primary_DC: 'DC-05' },
    { Customer_ID: 'CUST-503', Customer_Name: 'Customer 503', Latitude: 20.2961, Longitude: 85.8245, Primary_DC: 'DC-05' },

    { Customer_ID: 'CUST-601', Customer_Name: 'Customer 601', Latitude: 23.0338, Longitude: 72.5850, Primary_DC: 'DC-06' },
    { Customer_ID: 'CUST-602', Customer_Name: 'Customer 602', Latitude: 22.3072, Longitude: 73.1812, Primary_DC: 'DC-06' },
    { Customer_ID: 'CUST-603', Customer_Name: 'Customer 603', Latitude: 21.1702, Longitude: 72.8311, Primary_DC: 'DC-06' },
  ];

  const skuMaster: SKUMaster[] = [
    { SKU_ID: 'SKU-1001', SKU_Name: 'SKU 1', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Water' },
    { SKU_ID: 'SKU-1002', SKU_Name: 'SKU 2', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Juices' },
    { SKU_ID: 'SKU-1003', SKU_Name: 'SKU 3', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Coffee' },
    { SKU_ID: 'SKU-2001', SKU_Name: 'SKU 4', SKU_Hierarchy_L1: 'Foods', SKU_Hierarchy_L2: 'Staples' },
    { SKU_ID: 'SKU-2002', SKU_Name: 'SKU 5', SKU_Hierarchy_L1: 'Foods', SKU_Hierarchy_L2: 'Edible Oils' },
    { SKU_ID: 'SKU-2003', SKU_Name: 'SKU 6', SKU_Hierarchy_L1: 'Foods', SKU_Hierarchy_L2: 'Cereals' },
    { SKU_ID: 'SKU-3001', SKU_Name: 'SKU 7', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Detergents' },
    { SKU_ID: 'SKU-3002', SKU_Name: 'SKU 8', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Cleaners' },
    { SKU_ID: 'SKU-4001', SKU_Name: 'SKU 9', SKU_Hierarchy_L1: 'Personal Care', SKU_Hierarchy_L2: 'Hair Care' },
    { SKU_ID: 'SKU-4002', SKU_Name: 'SKU 10', SKU_Hierarchy_L1: 'Personal Care', SKU_Hierarchy_L2: 'Bath' },
  ];

  // Factory to Primary SKU mappings (where SKUs are produced)
  const factorySkuMap: Record<string, string[]> = {
    'FAC-01': ['SKU-1001', 'SKU-1002', 'SKU-2001', 'SKU-3001'],
    'FAC-02': ['SKU-1001', 'SKU-2002', 'SKU-3001', 'SKU-4001'],
    'FAC-03': ['SKU-1003', 'SKU-2003', 'SKU-4001', 'SKU-4002'],
    'FAC-04': ['SKU-2001', 'SKU-3002', 'SKU-4002'],
    'FAC-05': ['SKU-1002', 'SKU-2003', 'SKU-3002'],
  };

  // Generate STO Data across 52 weeks (Stock Transfer Orders from Factories to DCs)
  const stoData: STOData[] = [];
  let stoSeq = 1;
  const startDate = new Date('2025-01-01');

  for (let day = 1; day <= 360; day += 3) {
    const execDate = new Date(startDate.getTime() + (day - 1) * 86400000).toISOString().split('T')[0];
    for (const [facId, skus] of Object.entries(factorySkuMap)) {
      for (const dc of dcs) {
        // Send a few SKUs per run
        const chosenSku = skus[(day + dc.DC_ID.charCodeAt(3)) % skus.length];
        const qty = 30 + ((day * 7 + facId.charCodeAt(4)) % 50); // 30 to 80 pallets
        stoData.push({
          Factory_ID: facId,
          DC_ID: dc.DC_ID,
          SKU_ID: chosenSku,
          STO_Number: `STO-2025-${String(stoSeq++).padStart(5, '0')}`,
          Line_Item: 1,
          Qty_Pallets: qty,
          Execution_Date: execDate,
        });
      }
    }
  }

  // Generate Sales Orders across 360 days
  const salesOrders: SalesOrder[] = [];
  let orderSeq = 1;

  for (let day = 2; day <= 360; day += 2) {
    const genDate = new Date(startDate.getTime() + (day - 1) * 86400000).toISOString().split('T')[0];
    const delivDate = new Date(startDate.getTime() + (day + 2) * 86400000).toISOString().split('T')[0];

    // Pick 8 to 15 customer orders per cycle
    const numOrders = 8 + (day % 7);
    for (let o = 0; o < numOrders; o++) {
      const cust = customers[(day * 3 + o) % customers.length];
      const sku = skuMaster[(day + o * 2) % skuMaster.length];
      // Quantities from 10 to 65 pallets (some full truckload >=26, some smaller)
      const qty = 12 + ((day * 13 + o * 17) % 52); 

      salesOrders.push({
        Sales_Order: `SO-${String(orderSeq++).padStart(6, '0')}`,
        Line_Item: 1,
        SKU_ID: sku.SKU_ID,
        SKU_Hierarchy_L1: sku.SKU_Hierarchy_L1,
        Qty_Pallets: qty,
        Customer_ID: cust.Customer_ID,
        DC_ID: cust.Primary_DC,
        Order_Generation_Date: genDate,
        Requested_Delivery_Date: delivDate,
      });
    }
  }

  // Primary Shipment Cost (Factory -> DC)
  const primaryCosts: PrimaryShipmentCost[] = [];
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
  for (const fac of factories) {
    for (const dc of dcs) {
      for (const m of months) {
        // Approximate distance-based cost
        const latDiff = Math.abs(fac.Latitude - dc.Latitude);
        const lonDiff = Math.abs(fac.Longitude - dc.Longitude);
        const approxDist = Math.max(120, Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111);
        const totalPallets = 400 + Math.floor(approxDist * 0.8);
        const baseCost = Math.round(totalPallets * (22 + approxDist * 0.045));
        const fuelCost = Math.round(totalPallets * (8 + approxDist * 0.025));

        primaryCosts.push({
          Lane_Type: 'Primary',
          Factory_ID: fac.Factory_ID,
          DC_ID: dc.DC_ID,
          Month: m,
          Total_Pallets_Shipped: totalPallets,
          Base_Cost: baseCost,
          Fuel_Cost: fuelCost,
        });
      }
    }
  }

  // Secondary Shipment Cost (DC -> Customer)
  const secondaryCosts: SecondaryShipmentCost[] = [];
  for (const cust of customers) {
    const dc = dcs.find(d => d.DC_ID === cust.Primary_DC) || dcs[0];
    for (const m of months) {
      const latDiff = Math.abs(dc.Latitude - cust.Latitude);
      const lonDiff = Math.abs(dc.Longitude - cust.Longitude);
      const approxDist = Math.max(30, Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111);
      const totalPallets = 150 + Math.floor(approxDist * 0.4);
      const baseCost = Math.round(totalPallets * (18 + approxDist * 0.065));
      const fuelCost = Math.round(totalPallets * (7 + approxDist * 0.035));

      secondaryCosts.push({
        Lane_Type: 'Secondary',
        DC_ID: dc.DC_ID,
        Customer_ID: cust.Customer_ID,
        Month: m,
        Total_Pallets_Shipped: totalPallets,
        Base_Cost: baseCost,
        Fuel_Cost: fuelCost,
      });
    }
  }

  // WH & Factory Cost Master
  const whCosts: WHFactoryCostMaster[] = [
    // Factories
    ...factories.map(f => ({
      Location_Type: 'Factory',
      Location_ID: f.Factory_ID,
      Handling_In_Cost_Per_Pallet: 2.20,
      Handling_Out_Cost_Per_Pallet: 2.40,
      Storage_Cost_Per_Pallet_Per_Week: 1.15,
      Capacity_Pallets: f.Godown_Capacity_Pallets,
    })),
    // DCs
    ...dcs.map(d => ({
      Location_Type: 'DC',
      Location_ID: d.DC_ID,
      Handling_In_Cost_Per_Pallet: 3.80,
      Handling_Out_Cost_Per_Pallet: 4.10,
      Storage_Cost_Per_Pallet_Per_Week: 2.25,
      Capacity_Pallets: d.Godown_Capacity_Pallets,
    })),
  ];

  // 12 Standard Scenario Parameters
  const scenarios: ScenarioParameters[] = [
    {
      ScnName: 'Scn_01_Base_Direct',
      MinTruckload: 26,
      OrderCombHorizon: 0,
      MilkRuns: 'NO',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'NO',
      DOH_BoF_weeks: 1.5,
      DOH_DC_weeks: 3.5,
    },
    {
      ScnName: 'Scn_02_Comb_3Days',
      MinTruckload: 26,
      OrderCombHorizon: 3,
      MilkRuns: 'NO',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'NO',
      DOH_BoF_weeks: 1.5,
      DOH_DC_weeks: 3.5,
    },
    {
      ScnName: 'Scn_03_Comb_7Days',
      MinTruckload: 26,
      OrderCombHorizon: 7,
      MilkRuns: 'NO',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'NO',
      DOH_BoF_weeks: 1.5,
      DOH_DC_weeks: 3.5,
    },
    {
      ScnName: 'Scn_04_MilkRuns_0d',
      MinTruckload: 26,
      OrderCombHorizon: 0,
      MilkRuns: 'YES',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'NO',
      DOH_BoF_weeks: 1.5,
      DOH_DC_weeks: 3.5,
    },
    {
      ScnName: 'Scn_05_MilkRuns_3d',
      MinTruckload: 26,
      OrderCombHorizon: 3,
      MilkRuns: 'YES',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'NO',
      DOH_BoF_weeks: 1.5,
      DOH_DC_weeks: 3.5,
    },
    {
      ScnName: 'Scn_06_MilkRuns_7d',
      MinTruckload: 26,
      OrderCombHorizon: 7,
      MilkRuns: 'YES',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'NO',
      DOH_BoF_weeks: 1.5,
      DOH_DC_weeks: 3.5,
    },
    {
      ScnName: 'Scn_07_CapConstrained_0d',
      MinTruckload: 26,
      OrderCombHorizon: 0,
      MilkRuns: 'NO',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'YES',
      DOH_BoF_weeks: 2.0,
      DOH_DC_weeks: 4.0,
    },
    {
      ScnName: 'Scn_08_CapConstrained_3d',
      MinTruckload: 26,
      OrderCombHorizon: 3,
      MilkRuns: 'NO',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'YES',
      DOH_BoF_weeks: 2.0,
      DOH_DC_weeks: 4.0,
    },
    {
      ScnName: 'Scn_09_CapConstrained_7d',
      MinTruckload: 26,
      OrderCombHorizon: 7,
      MilkRuns: 'NO',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'YES',
      DOH_BoF_weeks: 2.0,
      DOH_DC_weeks: 4.0,
    },
    {
      ScnName: 'Scn_10_MilkRuns_Cap_0d',
      MinTruckload: 26,
      OrderCombHorizon: 0,
      MilkRuns: 'YES',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'YES',
      DOH_BoF_weeks: 2.0,
      DOH_DC_weeks: 4.0,
    },
    {
      ScnName: 'Scn_11_MilkRuns_Cap_3d',
      MinTruckload: 26,
      OrderCombHorizon: 3,
      MilkRuns: 'YES',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'YES',
      DOH_BoF_weeks: 2.0,
      DOH_DC_weeks: 4.0,
    },
    {
      ScnName: 'Scn_12_MilkRuns_Cap_7d',
      MinTruckload: 26,
      OrderCombHorizon: 7,
      MilkRuns: 'YES',
      BOFWeight: 1.0,
      LossWeight: -0.5,
      BOFStockWeight: -0.2,
      UseWHCapacityCons: 'YES',
      DOH_BoF_weeks: 2.0,
      DOH_DC_weeks: 4.0,
    },
  ];

  return {
    factories,
    dcs,
    customers,
    skuMaster,
    salesOrders,
    stoData,
    primaryCosts,
    secondaryCosts,
    whCosts,
    scenarios,
    sourceName: 'DD_Synthetic_Data.xlsx (Preloaded Sample)',
    loadedAt: new Date().toISOString(),
  };
}
