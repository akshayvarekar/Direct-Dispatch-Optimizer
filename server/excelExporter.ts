import ExcelJS from 'exceljs';
import { Dataset } from './types.js';

export async function exportDatasetToExcelBuffer(dataset: Dataset): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Direct Dispatch Optimizer';
  workbook.created = new Date();

  // 1. Factories
  const factSheet = workbook.addWorksheet('Factories');
  factSheet.columns = [
    { header: 'Factory_ID', key: 'Factory_ID', width: 15 },
    { header: 'Factory_Name', key: 'Factory_Name', width: 20 },
    { header: 'Latitude', key: 'Latitude', width: 14 },
    { header: 'Longitude', key: 'Longitude', width: 14 },
    { header: 'Godown_Capacity_Pallets', key: 'Godown_Capacity_Pallets', width: 25 },
  ];
  dataset.factories.forEach(f => factSheet.addRow(f));

  // 2. DCs
  const dcSheet = workbook.addWorksheet('DCs');
  dcSheet.columns = [
    { header: 'DC_ID', key: 'DC_ID', width: 15 },
    { header: 'DC_Name', key: 'DC_Name', width: 20 },
    { header: 'Latitude', key: 'Latitude', width: 14 },
    { header: 'Longitude', key: 'Longitude', width: 14 },
    { header: 'Godown_Capacity_Pallets', key: 'Godown_Capacity_Pallets', width: 25 },
  ];
  dataset.dcs.forEach(d => dcSheet.addRow(d));

  // 3. Customers
  const custSheet = workbook.addWorksheet('Customers');
  custSheet.columns = [
    { header: 'Customer_ID', key: 'Customer_ID', width: 15 },
    { header: 'Customer_Name', key: 'Customer_Name', width: 20 },
    { header: 'Latitude', key: 'Latitude', width: 14 },
    { header: 'Longitude', key: 'Longitude', width: 14 },
    { header: 'Primary_DC', key: 'Primary_DC', width: 15 },
  ];
  dataset.customers.forEach(c => custSheet.addRow(c));

  // 4. SKU_Master
  const skuSheet = workbook.addWorksheet('SKU_Master');
  skuSheet.columns = [
    { header: 'SKU_ID', key: 'SKU_ID', width: 15 },
    { header: 'SKU_Name', key: 'SKU_Name', width: 20 },
    { header: 'SKU_Hierarchy_L1', key: 'SKU_Hierarchy_L1', width: 20 },
    { header: 'SKU_Hierarchy_L2', key: 'SKU_Hierarchy_L2', width: 20 },
  ];
  dataset.skuMaster.forEach(s => skuSheet.addRow(s));

  // 5. Sales_Orders
  const soSheet = workbook.addWorksheet('Sales_Orders');
  soSheet.columns = [
    { header: 'Sales_Order', key: 'Sales_Order', width: 18 },
    { header: 'Line_Item', key: 'Line_Item', width: 12 },
    { header: 'SKU_ID', key: 'SKU_ID', width: 15 },
    { header: 'SKU_Hierarchy_L1', key: 'SKU_Hierarchy_L1', width: 20 },
    { header: 'Qty_Pallets', key: 'Qty_Pallets', width: 14 },
    { header: 'Customer_ID', key: 'Customer_ID', width: 15 },
    { header: 'DC_ID', key: 'DC_ID', width: 15 },
    { header: 'Order_Generation_Date', key: 'Order_Generation_Date', width: 22 },
    { header: 'Requested_Delivery_Date', key: 'Requested_Delivery_Date', width: 24 },
  ];
  dataset.salesOrders.forEach(so => soSheet.addRow(so));

  // 6. STO_Data
  const stoSheet = workbook.addWorksheet('STO_Data');
  stoSheet.columns = [
    { header: 'Factory_ID', key: 'Factory_ID', width: 15 },
    { header: 'DC_ID', key: 'DC_ID', width: 15 },
    { header: 'SKU_ID', key: 'SKU_ID', width: 15 },
    { header: 'STO_Number', key: 'STO_Number', width: 18 },
    { header: 'Line_Item', key: 'Line_Item', width: 12 },
    { header: 'Qty_Pallets', key: 'Qty_Pallets', width: 14 },
    { header: 'Execution_Date', key: 'Execution_Date', width: 18 },
  ];
  dataset.stoData.forEach(sto => stoSheet.addRow(sto));

  // 7. Primary_Shipment_Cost
  const pscSheet = workbook.addWorksheet('Primary_Shipment_Cost');
  pscSheet.columns = [
    { header: 'Lane_Type', key: 'Lane_Type', width: 15 },
    { header: 'Factory_ID', key: 'Factory_ID', width: 15 },
    { header: 'DC_ID', key: 'DC_ID', width: 15 },
    { header: 'Month', key: 'Month', width: 12 },
    { header: 'Total_Pallets_Shipped', key: 'Total_Pallets_Shipped', width: 22 },
    { header: 'Base_Cost', key: 'Base_Cost', width: 14 },
    { header: 'Fuel_Cost', key: 'Fuel_Cost', width: 14 },
  ];
  dataset.primaryCosts.forEach(p => pscSheet.addRow(p));

  // 8. Secondary_Shipment_Cost
  const sscSheet = workbook.addWorksheet('Secondary_Shipment_Cost');
  sscSheet.columns = [
    { header: 'Lane_Type', key: 'Lane_Type', width: 15 },
    { header: 'DC_ID', key: 'DC_ID', width: 15 },
    { header: 'Customer_ID', key: 'Customer_ID', width: 15 },
    { header: 'Month', key: 'Month', width: 12 },
    { header: 'Total_Pallets_Shipped', key: 'Total_Pallets_Shipped', width: 22 },
    { header: 'Base_Cost', key: 'Base_Cost', width: 14 },
    { header: 'Fuel_Cost', key: 'Fuel_Cost', width: 14 },
  ];
  dataset.secondaryCosts.forEach(s => sscSheet.addRow(s));

  // 9. WH_Factory_Cost_Master
  const whSheet = workbook.addWorksheet('WH_Factory_Cost_Master');
  whSheet.columns = [
    { header: 'Location_Type', key: 'Location_Type', width: 16 },
    { header: 'Location_ID', key: 'Location_ID', width: 15 },
    { header: 'Handling_In_Cost_Per_Pallet', key: 'Handling_In_Cost_Per_Pallet', width: 28 },
    { header: 'Handling_Out_Cost_Per_Pallet', key: 'Handling_Out_Cost_Per_Pallet', width: 28 },
    { header: 'Storage_Cost_Per_Pallet_Per_Week', key: 'Storage_Cost_Per_Pallet_Per_Week', width: 32 },
    { header: 'Capacity_Pallets', key: 'Capacity_Pallets', width: 20 },
  ];
  dataset.whCosts.forEach(w => whSheet.addRow(w));

  // 10. Scenario_Parameters
  const scnSheet = workbook.addWorksheet('Scenario_Parameters');
  scnSheet.columns = [
    { header: 'ScnName', key: 'ScnName', width: 28 },
    { header: 'MinTruckload', key: 'MinTruckload', width: 15 },
    { header: 'OrderCombHorizon', key: 'OrderCombHorizon', width: 20 },
    { header: 'MilkRuns', key: 'MilkRuns', width: 12 },
    { header: 'BOFWeight', key: 'BOFWeight', width: 14 },
    { header: 'LossWeight', key: 'LossWeight', width: 14 },
    { header: 'BOFStockWeight', key: 'BOFStockWeight', width: 16 },
    { header: 'UseWHCapacityCons', key: 'UseWHCapacityCons', width: 20 },
    { header: 'DOH_BoF_weeks', key: 'DOH_BoF_weeks', width: 16 },
    { header: 'DOH_DC_weeks', key: 'DOH_DC_weeks', width: 16 },
  ];
  dataset.scenarios.forEach(scn => scnSheet.addRow(scn));

  // Style header rows
  [factSheet, dcSheet, custSheet, skuSheet, soSheet, stoSheet, pscSheet, sscSheet, whSheet, scnSheet].forEach(sheet => {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
