import ExcelJS from 'exceljs';
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

// Helper to normalize strings for comparison
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getField(obj: Record<string, any>, candidateKeys: string[]): any {
  const normCandidates = candidateKeys.map(normalizeKey);
  for (const [key, val] of Object.entries(obj)) {
    const normKey = normalizeKey(key);
    if (normCandidates.includes(normKey)) {
      if (val !== undefined && val !== null && val !== '') {
        return val;
      }
    }
  }
  return undefined;
}

function findSheet(workbook: ExcelJS.Workbook, candidateNames: string[]): ExcelJS.Worksheet | undefined {
  const normCandidates = candidateNames.map(normalizeKey);
  for (const worksheet of workbook.worksheets) {
    const norm = normalizeKey(worksheet.name);
    if (normCandidates.includes(norm)) {
      return worksheet;
    }
  }
  return undefined;
}

function sheetToObjects(worksheet: ExcelJS.Worksheet): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    if (rowNumber === 1) {
      headers = values.map(v => (v !== null && v !== undefined ? String(v).trim() : ''));
    } else {
      const obj: Record<string, any> = {};
      let hasData = false;
      headers.forEach((header, index) => {
        if (!header) return;
        let cellVal = values[index];
        // Handle rich text or formula results in exceljs
        if (cellVal && typeof cellVal === 'object') {
          if ('result' in cellVal) cellVal = cellVal.result;
          else if ('text' in cellVal) cellVal = cellVal.text;
        }
        if (cellVal !== null && cellVal !== undefined && cellVal !== '') {
          hasData = true;
          obj[header] = cellVal;
        }
      });
      if (hasData) {
        rows.push(obj);
      }
    }
  });

  return rows;
}

function parseNumber(val: any, defaultVal = 0): number {
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (!val) return defaultVal;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? defaultVal : num;
}

function parseString(val: any, defaultVal = ''): string {
  if (val === null || val === undefined) return defaultVal;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).trim();
}

export async function parseExcelWorkbook(buffer: Buffer, originalFilename = 'DD_Synthetic_Data.xlsx'): Promise<Dataset> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // 1. Factories
  const factSheet = findSheet(workbook, ['Factories', 'Factory', 'Factory_Master', 'Factories_Master']);
  const factRows = factSheet ? sheetToObjects(factSheet) : [];
  const factories: Factory[] = factRows.map(r => {
    const facId = parseString(getField(r, ['Factory_ID', 'Factory ID', 'FactoryID', 'ID', 'Factory']));
    const facName = parseString(getField(r, ['Factory_Name', 'Factory Name', 'FactoryName', 'Name']), facId);
    const lat = parseNumber(getField(r, ['Latitude', 'Lat', 'Y']), 0);
    const lng = parseNumber(getField(r, ['Longitude', 'Long', 'Lng', 'Lon', 'X']), 0);
    const cap = parseNumber(getField(r, ['Godown_Capacity_Pallets', 'Godown Capacity Pallets', 'Godown Capacity (Pallets)', 'Godown Capacity', 'Godown_Capacity', 'Capacity_Pallets', 'CapacityPallets', 'Capacity']), 1800);
    return {
      Factory_ID: facId,
      Factory_Name: facName,
      Latitude: lat,
      Longitude: lng,
      Godown_Capacity_Pallets: cap,
    };
  }).filter(f => f.Factory_ID);

  // 2. DCs
  const dcSheet = findSheet(workbook, ['DCs', 'DC', 'DC_Master', 'Distribution_Centers', 'DistributionCenters']);
  const dcRows = dcSheet ? sheetToObjects(dcSheet) : [];
  const dcs: DC[] = dcRows.map(r => {
    const dcId = parseString(getField(r, ['DC_ID', 'DC ID', 'DCID', 'ID', 'DC']));
    const dcName = parseString(getField(r, ['DC_Name', 'DC Name', 'DCName', 'Name']), dcId);
    const lat = parseNumber(getField(r, ['Latitude', 'Lat', 'Y']), 0);
    const lng = parseNumber(getField(r, ['Longitude', 'Long', 'Lng', 'Lon', 'X']), 0);
    const cap = parseNumber(getField(r, ['Godown_Capacity_Pallets', 'Godown Capacity Pallets', 'Godown Capacity', 'Capacity_Pallets', 'Capacity']), 12000);
    return {
      DC_ID: dcId,
      DC_Name: dcName,
      Latitude: lat,
      Longitude: lng,
      Godown_Capacity_Pallets: cap,
    };
  }).filter(d => d.DC_ID);

  // 3. Customers
  const custSheet = findSheet(workbook, ['Customers', 'Customer', 'Customer_Master', 'CustomerMaster']);
  const custRows = custSheet ? sheetToObjects(custSheet) : [];
  const customers: Customer[] = custRows.map(r => {
    const custId = parseString(getField(r, ['Customer_ID', 'Customer ID', 'CustomerID', 'ID', 'Customer']));
    const custName = parseString(getField(r, ['Customer_Name', 'Customer Name', 'CustomerName', 'Name']), custId);
    const lat = parseNumber(getField(r, ['Latitude', 'Lat', 'Y']), 0);
    const lng = parseNumber(getField(r, ['Longitude', 'Long', 'Lng', 'Lon', 'X']), 0);
    const primaryDc = parseString(getField(r, ['Primary_DC', 'Primary DC', 'PrimaryDC', 'DC_ID', 'DC ID', 'DC']));
    return {
      Customer_ID: custId,
      Customer_Name: custName,
      Latitude: lat,
      Longitude: lng,
      Primary_DC: primaryDc,
    };
  }).filter(c => c.Customer_ID);

  // 4. SKU_Master
  const skuSheet = findSheet(workbook, ['SKU_Master', 'SKUMaster', 'SKU', 'SKUs', 'Item_Master', 'ItemMaster']);
  const skuRows = skuSheet ? sheetToObjects(skuSheet) : [];
  const skuMaster: SKUMaster[] = skuRows.map(r => {
    const skuId = parseString(getField(r, ['SKU_ID', 'SKU ID', 'SKUID', 'ID', 'SKU']));
    const skuName = parseString(getField(r, ['SKU_Name', 'SKU Name', 'SKUName', 'Name']), skuId);
    const l1 = parseString(getField(r, ['SKU_Hierarchy_L1', 'SKU Hierarchy L1', 'Hierarchy_L1', 'Category', 'L1']), 'General');
    const l2 = parseString(getField(r, ['SKU_Hierarchy_L2', 'SKU Hierarchy L2', 'Hierarchy_L2', 'SubCategory', 'L2']), 'General');
    return {
      SKU_ID: skuId,
      SKU_Name: skuName,
      SKU_Hierarchy_L1: l1,
      SKU_Hierarchy_L2: l2,
    };
  }).filter(s => s.SKU_ID);

  // 5. Sales_Orders
  const soSheet = findSheet(workbook, ['Sales_Orders', 'SalesOrders', 'Orders', 'SO_Data', 'Sales', 'Sales_Order']);
  const soRows = soSheet ? sheetToObjects(soSheet) : [];
  const salesOrders: SalesOrder[] = soRows.map((r, idx) => ({
    Sales_Order: parseString(getField(r, ['Sales_Order', 'Sales Order', 'SalesOrderID', 'SalesOrder', 'Order_ID', 'OrderID', 'Order']), `SO-${idx + 1}`),
    Line_Item: parseNumber(getField(r, ['Line_Item', 'Line Item', 'LineItem', 'Line', 'Item']), 1),
    SKU_ID: parseString(getField(r, ['SKU_ID', 'SKU ID', 'SKUID', 'SKU'])),
    SKU_Hierarchy_L1: parseString(getField(r, ['SKU_Hierarchy_L1', 'SKU Hierarchy L1', 'Hierarchy_L1', 'Category', 'L1']), 'General'),
    Qty_Pallets: parseNumber(getField(r, ['Qty_Pallets', 'Qty Pallets', 'Quantity_Pallets', 'Quantity Pallets', 'Qty', 'Quantity', 'Pallets']), 0),
    Customer_ID: parseString(getField(r, ['Customer_ID', 'Customer ID', 'CustomerID', 'Customer'])),
    DC_ID: parseString(getField(r, ['DC_ID', 'DC ID', 'DCID', 'Primary_DC', 'DC'])),
    Order_Generation_Date: parseString(getField(r, ['Order_Generation_Date', 'Order Generation Date', 'OrderDate', 'Generation_Date', 'Created_Date', 'Date']), '2025-01-01'),
    Requested_Delivery_Date: parseString(getField(r, ['Requested_Delivery_Date', 'Requested Delivery Date', 'DeliveryDate', 'Delivery_Date', 'RDD']), '2025-01-05'),
  })).filter(so => so.Sales_Order && so.Qty_Pallets > 0);

  // 6. STO_Data
  const stoSheet = findSheet(workbook, ['STO_Data', 'STOData', 'STO', 'STOs', 'Stock_Transfers', 'StockTransfers']);
  const stoRows = stoSheet ? sheetToObjects(stoSheet) : [];
  const stoData: STOData[] = stoRows.map((r, idx) => ({
    Factory_ID: parseString(getField(r, ['Factory_ID', 'Factory ID', 'FactoryID', 'Factory'])),
    DC_ID: parseString(getField(r, ['DC_ID', 'DC ID', 'DCID', 'DC'])),
    SKU_ID: parseString(getField(r, ['SKU_ID', 'SKU ID', 'SKUID', 'SKU'])),
    STO_Number: parseString(getField(r, ['STO_Number', 'STO Number', 'STONumber', 'STO_ID', 'STO']), `STO-${idx + 1}`),
    Line_Item: parseNumber(getField(r, ['Line_Item', 'Line Item', 'LineItem', 'Line']), 1),
    Qty_Pallets: parseNumber(getField(r, ['Qty_Pallets', 'Qty Pallets', 'Quantity_Pallets', 'Qty', 'Quantity', 'Pallets']), 0),
    Execution_Date: parseString(getField(r, ['Execution_Date', 'Execution Date', 'ExecutionDate', 'Date', 'STO_Date']), '2025-01-01'),
  })).filter(sto => sto.Factory_ID && sto.Qty_Pallets > 0);

  // 7. Primary_Shipment_Cost
  const pscSheet = findSheet(workbook, ['Primary_Shipment_Cost', 'PrimaryShipmentCost', 'Primary_Cost', 'PrimaryCosts']);
  const pscRows = pscSheet ? sheetToObjects(pscSheet) : [];
  const primaryCosts: PrimaryShipmentCost[] = pscRows.map(r => ({
    Lane_Type: parseString(getField(r, ['Lane_Type', 'Lane Type', 'Lane']), 'Primary'),
    Factory_ID: parseString(getField(r, ['Factory_ID', 'Factory ID', 'FactoryID', 'Factory'])),
    DC_ID: parseString(getField(r, ['DC_ID', 'DC ID', 'DCID', 'DC'])),
    Month: parseString(getField(r, ['Month', 'Period', 'Date']), '2025-01'),
    Total_Pallets_Shipped: parseNumber(getField(r, ['Total_Pallets_Shipped', 'Total Pallets Shipped', 'Total_Pallets', 'Pallets']), 1),
    Base_Cost: parseNumber(getField(r, ['Base_Cost', 'Base Cost', 'BaseCost', 'Base']), 0),
    Fuel_Cost: parseNumber(getField(r, ['Fuel_Cost', 'Fuel Cost', 'FuelCost', 'Fuel']), 0),
  })).filter(p => p.Factory_ID && p.DC_ID);

  // 8. Secondary_Shipment_Cost
  const sscSheet = findSheet(workbook, ['Secondary_Shipment_Cost', 'SecondaryShipmentCost', 'Secondary_Cost', 'SecondaryCosts']);
  const sscRows = sscSheet ? sheetToObjects(sscSheet) : [];
  const secondaryCosts: SecondaryShipmentCost[] = sscRows.map(r => ({
    Lane_Type: parseString(getField(r, ['Lane_Type', 'Lane Type', 'Lane']), 'Secondary'),
    DC_ID: parseString(getField(r, ['DC_ID', 'DC ID', 'DCID', 'DC'])),
    Customer_ID: parseString(getField(r, ['Customer_ID', 'Customer ID', 'CustomerID', 'Customer'])),
    Month: parseString(getField(r, ['Month', 'Period', 'Date']), '2025-01'),
    Total_Pallets_Shipped: parseNumber(getField(r, ['Total_Pallets_Shipped', 'Total Pallets Shipped', 'Total_Pallets', 'Pallets']), 1),
    Base_Cost: parseNumber(getField(r, ['Base_Cost', 'Base Cost', 'BaseCost', 'Base']), 0),
    Fuel_Cost: parseNumber(getField(r, ['Fuel_Cost', 'Fuel Cost', 'FuelCost', 'Fuel']), 0),
  })).filter(s => s.DC_ID && s.Customer_ID);

  // 9. WH_Factory_Cost_Master
  const whSheet = findSheet(workbook, ['WH_Factory_Cost_Master', 'WHFactoryCostMaster', 'WH_Cost', 'Warehousing_Costs', 'WH_Cost_Master']);
  const whRows = whSheet ? sheetToObjects(whSheet) : [];
  const whCosts: WHFactoryCostMaster[] = whRows.map(r => {
    const locId = parseString(getField(r, ['Location_ID', 'Location ID', 'LocationID', 'ID', 'Location']));
    const locType = parseString(getField(r, ['Location_Type', 'Location Type', 'Type']), locId?.startsWith('FAC') ? 'Factory' : 'DC');
    return {
      Location_Type: locType,
      Location_ID: locId,
      Handling_In_Cost_Per_Pallet: parseNumber(getField(r, ['Handling_In_Cost_Per_Pallet', 'Handling In Cost Per Pallet', 'Handling_In', 'HandlingIn']), 2.5),
      Handling_Out_Cost_Per_Pallet: parseNumber(getField(r, ['Handling_Out_Cost_Per_Pallet', 'Handling Out Cost Per Pallet', 'Handling_Out', 'HandlingOut']), 2.8),
      Storage_Cost_Per_Pallet_Per_Week: parseNumber(getField(r, ['Storage_Cost_Per_Pallet_Per_Week', 'Storage Cost Per Pallet Per Week', 'Storage_Cost', 'StorageCost']), 1.5),
      Capacity_Pallets: parseNumber(getField(r, ['Capacity_Pallets', 'Capacity Pallets', 'Capacity', 'Godown_Capacity_Pallets']), 10000),
    };
  }).filter(w => w.Location_ID);

  // 10. Scenario_Parameters (Read exclusively from the sheet)
  const scnSheet = findSheet(workbook, ['Scenario_Parameters', 'ScenarioParameters', 'Scenarios', 'Scenario_Master', 'ScenarioMaster']);
  const scnRows = scnSheet ? sheetToObjects(scnSheet) : [];
  const scenarios: ScenarioParameters[] = scnRows.map((r, idx) => ({
    ScnName: parseString(getField(r, ['ScnName', 'Scn Name', 'Scenario_Name', 'Scenario Name', 'Scenario', 'Name']), `Scenario_${idx + 1}`),
    MinTruckload: parseNumber(getField(r, ['MinTruckload', 'Min Truckload', 'Min_Truckload', 'MinTL']), 26),
    OrderCombHorizon: parseNumber(getField(r, ['OrderCombHorizon', 'Order Comb Horizon', 'Order_Comb_Horizon', 'Horizon']), 0),
    MilkRuns: parseString(getField(r, ['MilkRuns', 'Milk Runs', 'Milk_Runs']), 'NO').toUpperCase() === 'YES' ? 'YES' : 'NO',
    BOFWeight: parseNumber(getField(r, ['BOFWeight', 'BOF Weight', 'BOF_Weight']), 1.0),
    LossWeight: parseNumber(getField(r, ['LossWeight', 'Loss Weight', 'Loss_Weight']), -0.5),
    BOFStockWeight: parseNumber(getField(r, ['BOFStockWeight', 'BOF Stock Weight', 'BOF_Stock_Weight']), -0.2),
    UseWHCapacityCons: parseString(getField(r, ['UseWHCapacityCons', 'Use WH Capacity Cons', 'Use_WH_Capacity_Cons', 'WH_Capacity_Constraint', 'WHCapacityCons']), 'NO').toUpperCase() === 'YES' ? 'YES' : 'NO',
    DOH_BoF_weeks: parseNumber(getField(r, ['DOH_BoF_weeks', 'DOH BoF weeks', 'DOH_BoF', 'DOHBoF']), 1.5),
    DOH_DC_weeks: parseNumber(getField(r, ['DOH_DC_weeks', 'DOH DC weeks', 'DOH_DC', 'DOHDC']), 3.5),
  })).filter(s => s.ScnName);

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
    sourceName: originalFilename,
    loadedAt: new Date().toISOString(),
  };
}
