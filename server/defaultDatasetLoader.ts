import fs from 'fs';
import path from 'path';
import { Dataset, Factory, DC, Customer, SKUMaster, SalesOrder, STOData, PrimaryShipmentCost, SecondaryShipmentCost, WHFactoryCostMaster, ScenarioParameters } from './types.js';

export function loadDefaultDataset(): Dataset {
  const rawFactories: Factory[] = [
    { Factory_ID: 'FAC001', Factory_Name: 'Factory 1', Latitude: 19.07167, Longitude: 72.87221, Godown_Capacity_Pallets: 1800 },
    { Factory_ID: 'FAC002', Factory_Name: 'Factory 2', Latitude: 28.61511, Longitude: 77.25194, Godown_Capacity_Pallets: 1200 },
    { Factory_ID: 'FAC003', Factory_Name: 'Factory 3', Latitude: 12.97553, Longitude: 80.04894, Godown_Capacity_Pallets: 1200 },
    { Factory_ID: 'FAC004', Factory_Name: 'Factory 4', Latitude: 22.56536, Longitude: 88.35889, Godown_Capacity_Pallets: 1200 },
    { Factory_ID: 'FAC005', Factory_Name: 'Factory 5', Latitude: 23.28664, Longitude: 77.55839, Godown_Capacity_Pallets: 1200 }
  ];

  const rawDCs: DC[] = [
    { DC_ID: 'DC001', DC_Name: 'Distribution Center 001', Latitude: 18.78752, Longitude: 71.4855, Godown_Capacity_Pallets: 6000 },
    { DC_ID: 'DC002', DC_Name: 'Distribution Center 002', Latitude: 18.18193, Longitude: 72.28085, Godown_Capacity_Pallets: 3000 },
    { DC_ID: 'DC003', DC_Name: 'Distribution Center 003', Latitude: 29.13045, Longitude: 78.17262, Godown_Capacity_Pallets: 5000 },
    { DC_ID: 'DC004', DC_Name: 'Distribution Center 004', Latitude: 28.99836, Longitude: 77.13166, Godown_Capacity_Pallets: 3000 },
    { DC_ID: 'DC005', DC_Name: 'Distribution Center 005', Latitude: 12.63063, Longitude: 80.48241, Godown_Capacity_Pallets: 5000 },
    { DC_ID: 'DC006', DC_Name: 'Distribution Center 006', Latitude: 12.81513, Longitude: 78.76343, Godown_Capacity_Pallets: 6000 },
    { DC_ID: 'DC007', DC_Name: 'Distribution Center 007', Latitude: 22.38967, Longitude: 89.04287, Godown_Capacity_Pallets: 5000 },
    { DC_ID: 'DC008', DC_Name: 'Distribution Center 008', Latitude: 22.54031, Longitude: 88.26646, Godown_Capacity_Pallets: 4000 },
    { DC_ID: 'DC009', DC_Name: 'Distribution Center 009', Latitude: 25.24013, Longitude: 77.36034, Godown_Capacity_Pallets: 3000 },
    { DC_ID: 'DC010', DC_Name: 'Distribution Center 010', Latitude: 22.02017, Longitude: 77.97394, Godown_Capacity_Pallets: 4000 }
  ];

  const rawCustomers: Customer[] = [
    { Customer_ID: 'CUST0001', Customer_Name: 'Customer 1', Latitude: 25.19485, Longitude: 77.41352, Primary_DC: 'DC009' },
    { Customer_ID: 'CUST0002', Customer_Name: 'Customer 2', Latitude: 18.75607, Longitude: 71.79569, Primary_DC: 'DC001' },
    { Customer_ID: 'CUST0003', Customer_Name: 'Customer 3', Latitude: 21.90537, Longitude: 77.80784, Primary_DC: 'DC010' },
    { Customer_ID: 'CUST0004', Customer_Name: 'Customer 4', Latitude: 18.29124, Longitude: 72.49373, Primary_DC: 'DC002' },
    { Customer_ID: 'CUST0005', Customer_Name: 'Customer 5', Latitude: 18.24387, Longitude: 72.3886, Primary_DC: 'DC002' },
    { Customer_ID: 'CUST0006', Customer_Name: 'Customer 6', Latitude: 25.44149, Longitude: 77.34566, Primary_DC: 'DC009' },
    { Customer_ID: 'CUST0007', Customer_Name: 'Customer 7', Latitude: 18.58532, Longitude: 71.40564, Primary_DC: 'DC001' },
    { Customer_ID: 'CUST0008', Customer_Name: 'Customer 8', Latitude: 12.76542, Longitude: 80.27313, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0009', Customer_Name: 'Customer 9', Latitude: 29.13178, Longitude: 78.18411, Primary_DC: 'DC003' },
    { Customer_ID: 'CUST0010', Customer_Name: 'Customer 10', Latitude: 12.59688, Longitude: 80.56171, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0011', Customer_Name: 'Customer 11', Latitude: 12.88729, Longitude: 79.05922, Primary_DC: 'DC006' },
    { Customer_ID: 'CUST0012', Customer_Name: 'Customer 12', Latitude: 18.25269, Longitude: 72.20764, Primary_DC: 'DC002' },
    { Customer_ID: 'CUST0013', Customer_Name: 'Customer 13', Latitude: 28.92853, Longitude: 77.01347, Primary_DC: 'DC004' },
    { Customer_ID: 'CUST0014', Customer_Name: 'Customer 14', Latitude: 29.25477, Longitude: 78.0879, Primary_DC: 'DC003' },
    { Customer_ID: 'CUST0015', Customer_Name: 'Customer 15', Latitude: 22.53305, Longitude: 88.35029, Primary_DC: 'DC008' },
    { Customer_ID: 'CUST0016', Customer_Name: 'Customer 16', Latitude: 22.31291, Longitude: 89.00917, Primary_DC: 'DC007' },
    { Customer_ID: 'CUST0017', Customer_Name: 'Customer 17', Latitude: 12.38658, Longitude: 80.33538, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0018', Customer_Name: 'Customer 18', Latitude: 18.12614, Longitude: 72.32386, Primary_DC: 'DC002' },
    { Customer_ID: 'CUST0019', Customer_Name: 'Customer 19', Latitude: 25.40077, Longitude: 77.35759, Primary_DC: 'DC009' },
    { Customer_ID: 'CUST0020', Customer_Name: 'Customer 20', Latitude: 18.80002, Longitude: 71.49398, Primary_DC: 'DC001' },
    { Customer_ID: 'CUST0021', Customer_Name: 'Customer 21', Latitude: 18.33465, Longitude: 72.41323, Primary_DC: 'DC002' },
    { Customer_ID: 'CUST0022', Customer_Name: 'Customer 22', Latitude: 22.5751, Longitude: 88.12735, Primary_DC: 'DC008' },
    { Customer_ID: 'CUST0023', Customer_Name: 'Customer 23', Latitude: 12.926, Longitude: 78.81139, Primary_DC: 'DC006' },
    { Customer_ID: 'CUST0024', Customer_Name: 'Customer 24', Latitude: 22.55646, Longitude: 89.03847, Primary_DC: 'DC007' },
    { Customer_ID: 'CUST0025', Customer_Name: 'Customer 25', Latitude: 22.28712, Longitude: 77.92103, Primary_DC: 'DC010' },
    { Customer_ID: 'CUST0026', Customer_Name: 'Customer 26', Latitude: 29.22502, Longitude: 77.15039, Primary_DC: 'DC004' },
    { Customer_ID: 'CUST0027', Customer_Name: 'Customer 27', Latitude: 22.46987, Longitude: 88.09976, Primary_DC: 'DC008' },
    { Customer_ID: 'CUST0028', Customer_Name: 'Customer 28', Latitude: 22.36834, Longitude: 89.26023, Primary_DC: 'DC007' },
    { Customer_ID: 'CUST0029', Customer_Name: 'Customer 29', Latitude: 12.7354, Longitude: 80.57301, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0030', Customer_Name: 'Customer 30', Latitude: 12.527, Longitude: 78.85185, Primary_DC: 'DC006' },
    { Customer_ID: 'CUST0031', Customer_Name: 'Customer 31', Latitude: 22.44871, Longitude: 88.9797, Primary_DC: 'DC007' },
    { Customer_ID: 'CUST0032', Customer_Name: 'Customer 32', Latitude: 25.1838, Longitude: 77.36011, Primary_DC: 'DC009' },
    { Customer_ID: 'CUST0033', Customer_Name: 'Customer 33', Latitude: 22.77446, Longitude: 88.11138, Primary_DC: 'DC008' },
    { Customer_ID: 'CUST0034', Customer_Name: 'Customer 34', Latitude: 12.57025, Longitude: 80.67939, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0035', Customer_Name: 'Customer 35', Latitude: 12.5933, Longitude: 80.45118, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0036', Customer_Name: 'Customer 36', Latitude: 23.3, Longitude: 77.3738, Primary_DC: 'DC009' },
    { Customer_ID: 'CUST0037', Customer_Name: 'Customer 37', Latitude: 13.00545, Longitude: 79.8801, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0038', Customer_Name: 'Customer 38', Latitude: 13.07774, Longitude: 80.04932, Primary_DC: 'DC006' },
    { Customer_ID: 'CUST0039', Customer_Name: 'Customer 39', Latitude: 28.90588, Longitude: 77.29268, Primary_DC: 'DC004' },
    { Customer_ID: 'CUST0040', Customer_Name: 'Customer 40', Latitude: 28.80482, Longitude: 77.04571, Primary_DC: 'DC003' },
    { Customer_ID: 'CUST0041', Customer_Name: 'Customer 41', Latitude: 19.06521, Longitude: 72.89029, Primary_DC: 'DC002' },
    { Customer_ID: 'CUST0042', Customer_Name: 'Customer 42', Latitude: 23.50173, Longitude: 77.33292, Primary_DC: 'DC010' },
    { Customer_ID: 'CUST0043', Customer_Name: 'Customer 43', Latitude: 28.74669, Longitude: 77.34142, Primary_DC: 'DC003' },
    { Customer_ID: 'CUST0044', Customer_Name: 'Customer 44', Latitude: 19.28918, Longitude: 72.97912, Primary_DC: 'DC002' },
    { Customer_ID: 'CUST0045', Customer_Name: 'Customer 45', Latitude: 12.97955, Longitude: 80.0076, Primary_DC: 'DC005' },
    { Customer_ID: 'CUST0046', Customer_Name: 'Customer 46', Latitude: 12.80426, Longitude: 80.07646, Primary_DC: 'DC006' },
    { Customer_ID: 'CUST0047', Customer_Name: 'Customer 47', Latitude: 12.94954, Longitude: 80.32998, Primary_DC: 'DC006' },
    { Customer_ID: 'CUST0048', Customer_Name: 'Customer 48', Latitude: 22.50621, Longitude: 88.39247, Primary_DC: 'DC008' },
    { Customer_ID: 'CUST0049', Customer_Name: 'Customer 49', Latitude: 28.39193, Longitude: 77.18786, Primary_DC: 'DC004' },
    { Customer_ID: 'CUST0050', Customer_Name: 'Customer 50', Latitude: 23.31634, Longitude: 77.6604, Primary_DC: 'DC009' }
  ];

  const rawSKUs: SKUMaster[] = [
    { SKU_ID: 'SKU0001', SKU_Name: 'Personal Care Product 1', SKU_Hierarchy_L1: 'Personal Care', SKU_Hierarchy_L2: 'Personal Care-Sub2' },
    { SKU_ID: 'SKU0002', SKU_Name: 'Dairy Product 2', SKU_Hierarchy_L1: 'Dairy', SKU_Hierarchy_L2: 'Dairy-Sub2' },
    { SKU_ID: 'SKU0003', SKU_Name: 'Beverages Product 3', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Beverages-Sub1' },
    { SKU_ID: 'SKU0004', SKU_Name: 'Snacks Product 4', SKU_Hierarchy_L1: 'Snacks', SKU_Hierarchy_L2: 'Snacks-Sub1' },
    { SKU_ID: 'SKU0005', SKU_Name: 'Personal Care Product 5', SKU_Hierarchy_L1: 'Personal Care', SKU_Hierarchy_L2: 'Personal Care-Sub1' },
    { SKU_ID: 'SKU0006', SKU_Name: 'Dairy Product 6', SKU_Hierarchy_L1: 'Dairy', SKU_Hierarchy_L2: 'Dairy-Sub3' },
    { SKU_ID: 'SKU0007', SKU_Name: 'Snacks Product 7', SKU_Hierarchy_L1: 'Snacks', SKU_Hierarchy_L2: 'Snacks-Sub3' },
    { SKU_ID: 'SKU0008', SKU_Name: 'Snacks Product 8', SKU_Hierarchy_L1: 'Snacks', SKU_Hierarchy_L2: 'Snacks-Sub1' },
    { SKU_ID: 'SKU0009', SKU_Name: 'Beverages Product 9', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Beverages-Sub3' },
    { SKU_ID: 'SKU0010', SKU_Name: 'Beverages Product 10', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Beverages-Sub1' },
    { SKU_ID: 'SKU0011', SKU_Name: 'Beverages Product 11', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Beverages-Sub1' },
    { SKU_ID: 'SKU0012', SKU_Name: 'Personal Care Product 12', SKU_Hierarchy_L1: 'Personal Care', SKU_Hierarchy_L2: 'Personal Care-Sub1' },
    { SKU_ID: 'SKU0013', SKU_Name: 'Dairy Product 13', SKU_Hierarchy_L1: 'Dairy', SKU_Hierarchy_L2: 'Dairy-Sub1' },
    { SKU_ID: 'SKU0014', SKU_Name: 'Personal Care Product 14', SKU_Hierarchy_L1: 'Personal Care', SKU_Hierarchy_L2: 'Personal Care-Sub3' },
    { SKU_ID: 'SKU0015', SKU_Name: 'Home Care Product 15', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Home Care-Sub1' },
    { SKU_ID: 'SKU0016', SKU_Name: 'Dairy Product 16', SKU_Hierarchy_L1: 'Dairy', SKU_Hierarchy_L2: 'Dairy-Sub1' },
    { SKU_ID: 'SKU0017', SKU_Name: 'Dairy Product 17', SKU_Hierarchy_L1: 'Dairy', SKU_Hierarchy_L2: 'Dairy-Sub3' },
    { SKU_ID: 'SKU0018', SKU_Name: 'Home Care Product 18', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Home Care-Sub1' },
    { SKU_ID: 'SKU0019', SKU_Name: 'Home Care Product 19', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Home Care-Sub2' },
    { SKU_ID: 'SKU0020', SKU_Name: 'Snacks Product 20', SKU_Hierarchy_L1: 'Snacks', SKU_Hierarchy_L2: 'Snacks-Sub1' },
    { SKU_ID: 'SKU0021', SKU_Name: 'Beverages Product 21', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Beverages-Sub3' },
    { SKU_ID: 'SKU0022', SKU_Name: 'Home Care Product 22', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Home Care-Sub2' },
    { SKU_ID: 'SKU0023', SKU_Name: 'Home Care Product 23', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Home Care-Sub2' },
    { SKU_ID: 'SKU0024', SKU_Name: 'Home Care Product 24', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Home Care-Sub3' },
    { SKU_ID: 'SKU0025', SKU_Name: 'Beverages Product 25', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Beverages-Sub3' },
    { SKU_ID: 'SKU0026', SKU_Name: 'Beverages Product 26', SKU_Hierarchy_L1: 'Beverages', SKU_Hierarchy_L2: 'Beverages-Sub1' },
    { SKU_ID: 'SKU0027', SKU_Name: 'Home Care Product 27', SKU_Hierarchy_L1: 'Home Care', SKU_Hierarchy_L2: 'Home Care-Sub3' },
    { SKU_ID: 'SKU0028', SKU_Name: 'Personal Care Product 28', SKU_Hierarchy_L1: 'Personal Care', SKU_Hierarchy_L2: 'Personal Care-Sub1' },
    { SKU_ID: 'SKU0029', SKU_Name: 'Snacks Product 29', SKU_Hierarchy_L1: 'Snacks', SKU_Hierarchy_L2: 'Snacks-Sub1' },
    { SKU_ID: 'SKU0030', SKU_Name: 'Snacks Product 30', SKU_Hierarchy_L1: 'Snacks', SKU_Hierarchy_L2: 'Snacks-Sub3' }
  ];

  const rawWHCosts: WHFactoryCostMaster[] = [
    { Location_Type: 'DC', Location_ID: 'DC001', Handling_In_Cost_Per_Pallet: 14.11, Handling_Out_Cost_Per_Pallet: 10.29, Storage_Cost_Per_Pallet_Per_Week: 3.62, Capacity_Pallets: 6000 },
    { Location_Type: 'DC', Location_ID: 'DC002', Handling_In_Cost_Per_Pallet: 9.98, Handling_Out_Cost_Per_Pallet: 10.34, Storage_Cost_Per_Pallet_Per_Week: 2.2, Capacity_Pallets: 3000 },
    { Location_Type: 'DC', Location_ID: 'DC003', Handling_In_Cost_Per_Pallet: 8.53, Handling_Out_Cost_Per_Pallet: 8.65, Storage_Cost_Per_Pallet_Per_Week: 3.67, Capacity_Pallets: 5000 },
    { Location_Type: 'DC', Location_ID: 'DC004', Handling_In_Cost_Per_Pallet: 8.79, Handling_Out_Cost_Per_Pallet: 9.11, Storage_Cost_Per_Pallet_Per_Week: 3.54, Capacity_Pallets: 3000 },
    { Location_Type: 'DC', Location_ID: 'DC005', Handling_In_Cost_Per_Pallet: 13.96, Handling_Out_Cost_Per_Pallet: 12.02, Storage_Cost_Per_Pallet_Per_Week: 3.41, Capacity_Pallets: 5000 },
    { Location_Type: 'DC', Location_ID: 'DC006', Handling_In_Cost_Per_Pallet: 12.55, Handling_Out_Cost_Per_Pallet: 9.34, Storage_Cost_Per_Pallet_Per_Week: 2.22, Capacity_Pallets: 6000 },
    { Location_Type: 'DC', Location_ID: 'DC007', Handling_In_Cost_Per_Pallet: 12.79, Handling_Out_Cost_Per_Pallet: 13.72, Storage_Cost_Per_Pallet_Per_Week: 3.4, Capacity_Pallets: 5000 },
    { Location_Type: 'DC', Location_ID: 'DC008', Handling_In_Cost_Per_Pallet: 14.23, Handling_Out_Cost_Per_Pallet: 14.96, Storage_Cost_Per_Pallet_Per_Week: 2.46, Capacity_Pallets: 4000 },
    { Location_Type: 'DC', Location_ID: 'DC009', Handling_In_Cost_Per_Pallet: 10.31, Handling_Out_Cost_Per_Pallet: 9.27, Storage_Cost_Per_Pallet_Per_Week: 3.73, Capacity_Pallets: 3000 },
    { Location_Type: 'DC', Location_ID: 'DC010', Handling_In_Cost_Per_Pallet: 11.18, Handling_Out_Cost_Per_Pallet: 13.47, Storage_Cost_Per_Pallet_Per_Week: 4.22, Capacity_Pallets: 4000 },
    { Location_Type: 'Factory', Location_ID: 'FAC001', Handling_In_Cost_Per_Pallet: 0, Handling_Out_Cost_Per_Pallet: 11.69, Storage_Cost_Per_Pallet_Per_Week: 3.72, Capacity_Pallets: 1800 },
    { Location_Type: 'Factory', Location_ID: 'FAC002', Handling_In_Cost_Per_Pallet: 0, Handling_Out_Cost_Per_Pallet: 8.41, Storage_Cost_Per_Pallet_Per_Week: 2.23, Capacity_Pallets: 1200 },
    { Location_Type: 'Factory', Location_ID: 'FAC003', Handling_In_Cost_Per_Pallet: 0, Handling_Out_Cost_Per_Pallet: 9.74, Storage_Cost_Per_Pallet_Per_Week: 2.47, Capacity_Pallets: 1200 },
    { Location_Type: 'Factory', Location_ID: 'FAC004', Handling_In_Cost_Per_Pallet: 0, Handling_Out_Cost_Per_Pallet: 6.05, Storage_Cost_Per_Pallet_Per_Week: 2.31, Capacity_Pallets: 1200 },
    { Location_Type: 'Factory', Location_ID: 'FAC005', Handling_In_Cost_Per_Pallet: 0, Handling_Out_Cost_Per_Pallet: 6.9, Storage_Cost_Per_Pallet_Per_Week: 3.64, Capacity_Pallets: 1200 }
  ];

  const rawScenarios: ScenarioParameters[] = [
    { ScnName: 'Include Milkruns in a 1 day window', MinTruckload: 26, OrderCombHorizon: 0, MilkRuns: 'YES', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'NO', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: 'Include Milkruns in a 3 days window', MinTruckload: 26, OrderCombHorizon: 3, MilkRuns: 'YES', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'NO', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: 'Include Milkruns in a 7 days window', MinTruckload: 26, OrderCombHorizon: 7, MilkRuns: 'YES', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'NO', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: 'Daily consolidation w/o WH constraint', MinTruckload: 26, OrderCombHorizon: 0, MilkRuns: 'NO', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'NO', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: '3 days consolidation w/o WH constraint', MinTruckload: 26, OrderCombHorizon: 3, MilkRuns: 'NO', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'NO', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: '7 days consolidation w/o WH constraint', MinTruckload: 26, OrderCombHorizon: 7, MilkRuns: 'NO', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'NO', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: 'Daily consolidation with WH constraint', MinTruckload: 26, OrderCombHorizon: 0, MilkRuns: 'NO', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'YES', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: '3 days consolidation with WH constraint', MinTruckload: 26, OrderCombHorizon: 3, MilkRuns: 'NO', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'YES', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 },
    { ScnName: '7 days consolidation with WH constraint', MinTruckload: 26, OrderCombHorizon: 7, MilkRuns: 'NO', BOFWeight: 10, LossWeight: -20, BOFStockWeight: -0.11, UseWHCapacityCons: 'YES', DOH_BoF_weeks: 3, DOH_DC_weeks: 3 }
  ];

  const getFilePath = (fileName: string) => {
    const cwdPath = path.join(process.cwd(), 'server', fileName);
    if (fs.existsSync(cwdPath)) return cwdPath;
    const directPath = path.join(process.cwd(), fileName);
    if (fs.existsSync(directPath)) return directPath;
    return cwdPath;
  };

  const primaryCostsFile = fs.readFileSync(getFilePath('data_primary.tsv'), 'utf-8');
  const secondaryCostsFile = fs.readFileSync(getFilePath('data_secondary.tsv'), 'utf-8');
  const salesOrdersFile = fs.readFileSync(getFilePath('data_sales_orders.tsv'), 'utf-8');
  const stoDataFile = fs.readFileSync(getFilePath('data_sto.tsv'), 'utf-8');

  return {
    sourceName: 'User_Uploaded_Dataset.xlsx (Active)',
    factories: rawFactories,
    dcs: rawDCs,
    customers: rawCustomers,
    skuMaster: rawSKUs,
    whCosts: rawWHCosts,
    scenarios: rawScenarios,
    primaryCosts: parseTsvPrimary(primaryCostsFile),
    secondaryCosts: parseTsvSecondary(secondaryCostsFile),
    salesOrders: parseTsvSalesOrders(salesOrdersFile),
    stoData: parseTsvSto(stoDataFile),
  };
}

function parseTsvPrimary(text: string): PrimaryShipmentCost[] {
  const lines = text.trim().split('\n');
  const res: PrimaryShipmentCost[] = [];
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('\t');
    if (p.length >= 7) {
      res.push({
        Lane_Type: p[0].trim(),
        Factory_ID: p[1].trim(),
        DC_ID: p[2].trim(),
        Month: p[3].trim(),
        Total_Pallets_Shipped: parseFloat(p[4]),
        Base_Cost: parseFloat(p[5]),
        Fuel_Cost: parseFloat(p[6]),
      });
    }
  }
  return res;
}

function parseTsvSecondary(text: string): SecondaryShipmentCost[] {
  const lines = text.trim().split('\n');
  const res: SecondaryShipmentCost[] = [];
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('\t');
    if (p.length >= 7) {
      res.push({
        Lane_Type: p[0].trim(),
        DC_ID: p[1].trim(),
        Customer_ID: p[2].trim(),
        Month: p[3].trim(),
        Total_Pallets_Shipped: parseFloat(p[4]),
        Base_Cost: parseFloat(p[5]),
        Fuel_Cost: parseFloat(p[6]),
      });
    }
  }
  return res;
}

function parseTsvSalesOrders(text: string): SalesOrder[] {
  const lines = text.trim().split('\n');
  const res: SalesOrder[] = [];
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('\t');
    if (p.length >= 9) {
      res.push({
        Sales_Order: p[0].trim(),
        Line_Item: parseInt(p[1]),
        SKU_ID: p[2].trim(),
        SKU_Hierarchy_L1: p[3].trim(),
        Qty_Pallets: parseFloat(p[4]),
        Customer_ID: p[5].trim(),
        DC_ID: p[6].trim(),
        Order_Generation_Date: p[7].trim(),
        Requested_Delivery_Date: p[8].trim(),
      });
    }
  }
  return res;
}

function parseTsvSto(text: string): STOData[] {
  const lines = text.trim().split('\n');
  const res: STOData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split('\t');
    if (p.length >= 7) {
      res.push({
        Factory_ID: p[0].trim(),
        DC_ID: p[1].trim(),
        SKU_ID: p[2].trim(),
        STO_Number: p[3].trim(),
        Line_Item: parseInt(p[4]),
        Qty_Pallets: parseFloat(p[5]),
        Execution_Date: p[6].trim(),
      });
    }
  }
  return res;
}
