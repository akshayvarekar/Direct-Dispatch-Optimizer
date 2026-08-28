import {
  Dataset,
  ScenarioParameters,
  ScenarioRunResult,
  FactorySiteResult,
  AlphaEntry,
  OrderEvaluationDetail,
  DailyLedgerPoint,
  Factory,
  DC,
  Customer,
  WHFactoryCostMaster,
  SalesOrder,
} from './types.js';

// 1. Distance Calculation (Haversine Formula)
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 50;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(R * c * 10) / 10);
}

// 2. Greedy Nearest-Neighbor Customer Clustering for MilkRuns
export function clusterCustomers(customers: Customer[], maxDistanceKm = 25): Map<string, string> {
  const clusterMap = new Map<string, string>(); // customerId -> clusterId
  const visited = new Set<string>();

  for (let i = 0; i < customers.length; i++) {
    const root = customers[i];
    if (visited.has(root.Customer_ID)) continue;

    const clusterId = `CLUSTER-${root.Customer_ID}`;
    clusterMap.set(root.Customer_ID, clusterId);
    visited.add(root.Customer_ID);

    for (let j = i + 1; j < customers.length; j++) {
      const candidate = customers[j];
      if (visited.has(candidate.Customer_ID)) continue;

      const dist = haversineDistanceKm(root.Latitude, root.Longitude, candidate.Latitude, candidate.Longitude);
      if (dist <= maxDistanceKm) {
        clusterMap.set(candidate.Customer_ID, clusterId);
        visited.add(candidate.Customer_ID);
      }
    }
  }

  return clusterMap;
}

// Helper: Precalculate historical lane costs
interface CostCache {
  pcppMap: Map<string, number>; // "facId|dcId" -> PCPP
  scppMap: Map<string, number>; // "dcId|custId" -> SCPP
  avgPcppPerKm: number;
}

function buildCostCache(dataset: Dataset, factoryMap: Map<string, Factory>, dcMap: Map<string, DC>): CostCache {
  const pcppMap = new Map<string, number>();
  const pcppSums = new Map<string, { cost: number; pallets: number }>();

  for (const row of dataset.primaryCosts) {
    const key = `${row.Factory_ID}|${row.DC_ID}`;
    const curr = pcppSums.get(key) || { cost: 0, pallets: 0 };
    curr.cost += (row.Base_Cost || 0) + (row.Fuel_Cost || 0);
    curr.pallets += row.Total_Pallets_Shipped || 1;
    pcppSums.set(key, curr);
  }

  let totalPcppCost = 0;
  let totalPcppKmPallets = 0;

  for (const [key, val] of pcppSums.entries()) {
    const pcpp = val.pallets > 0 ? val.cost / val.pallets : 25;
    pcppMap.set(key, pcpp);

    const [fId, dId] = key.split('|');
    const f = factoryMap.get(fId);
    const d = dcMap.get(dId);
    if (f && d) {
      const dist = haversineDistanceKm(f.Latitude, f.Longitude, d.Latitude, d.Longitude);
      totalPcppCost += val.cost;
      totalPcppKmPallets += val.pallets * dist;
    }
  }

  const avgPcppPerKm = totalPcppKmPallets > 0 ? totalPcppCost / totalPcppKmPallets : 0.08;

  // Secondary cost
  const scppMap = new Map<string, number>();
  const scppSums = new Map<string, { cost: number; pallets: number }>();

  for (const row of dataset.secondaryCosts) {
    const key = `${row.DC_ID}|${row.Customer_ID}`;
    const curr = scppSums.get(key) || { cost: 0, pallets: 0 };
    curr.cost += (row.Base_Cost || 0) + (row.Fuel_Cost || 0);
    curr.pallets += row.Total_Pallets_Shipped || 1;
    scppSums.set(key, curr);
  }

  for (const [key, val] of scppSums.entries()) {
    const scpp = val.pallets > 0 ? val.cost / val.pallets : 18;
    scppMap.set(key, scpp);
  }

  return { pcppMap, scppMap, avgPcppPerKm };
}

// Prepared Pre-aggregated data structures for super-fast simulation loops
interface PreAggregatedData {
  factoryMap: Map<string, Factory>;
  dcMap: Map<string, DC>;
  custMap: Map<string, Customer>;
  whCostMap: Map<string, WHFactoryCostMaster>;
  skuProducingFactories: Map<string, string[]>; // skuId -> [factoryId...]
  costCache: CostCache;
  stByDate: Array<{ date: string; factoryId: string; skuId: string; qty: number }>;
  stoByDateMap: Map<string, Array<{ factoryId: string; skuId: string; qty: number }>>;
  allDates: string[];
  factorySkuKeys: string[]; // "facId|skuId"
}

export function prepareData(dataset: Dataset): PreAggregatedData {
  const factoryMap = new Map<string, Factory>();
  dataset.factories.forEach(f => factoryMap.set(f.Factory_ID, f));

  const dcMap = new Map<string, DC>();
  dataset.dcs.forEach(d => dcMap.set(d.DC_ID, d));

  const custMap = new Map<string, Customer>();
  dataset.customers.forEach(c => custMap.set(c.Customer_ID, c));

  const whCostMap = new Map<string, WHFactoryCostMaster>();
  dataset.whCosts.forEach(w => whCostMap.set(w.Location_ID, w));

  const skuProducingFactories = new Map<string, string[]>();
  const facSkuKeySet = new Set<string>();

  for (const sto of dataset.stoData) {
    const list = skuProducingFactories.get(sto.SKU_ID) || [];
    if (!list.includes(sto.Factory_ID)) {
      list.push(sto.Factory_ID);
      skuProducingFactories.set(sto.SKU_ID, list);
    }
    facSkuKeySet.add(`${sto.Factory_ID}|${sto.SKU_ID}`);
  }

  const costCache = buildCostCache(dataset, factoryMap, dcMap);

  // Group STOs by execution date
  const stByDate = dataset.stoData.map(s => ({
    date: s.Execution_Date,
    factoryId: s.Factory_ID,
    skuId: s.SKU_ID,
    qty: s.Qty_Pallets,
  }));

  const stoByDateMap = new Map<string, Array<{ factoryId: string; skuId: string; qty: number }>>();
  for (const sto of stByDate) {
    let list = stoByDateMap.get(sto.date);
    if (!list) {
      list = [];
      stoByDateMap.set(sto.date, list);
    }
    list.push(sto);
  }

  const allDatesSet = new Set<string>();
  dataset.stoData.forEach(s => allDatesSet.add(s.Execution_Date));
  dataset.salesOrders.forEach(o => allDatesSet.add(o.Requested_Delivery_Date));
  const allDates = Array.from(allDatesSet).sort();

  return {
    factoryMap,
    dcMap,
    custMap,
    whCostMap,
    skuProducingFactories,
    costCache,
    stByDate,
    stoByDateMap,
    allDates,
    factorySkuKeys: Array.from(facSkuKeySet),
  };
}

export interface PreparedOrderGroup {
  groupId: string;
  clusterOrCustId: string;
  deliveryDate: string;
  skuBreakdown: Array<{ skuId: string; qty: number }>;
  totalQty: number;
  orders: any[];
  assignedFactoryId: string;
  assignedDCId: string;
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
  unitCo2ReductionKg: number;
}

// Helper to safely parse date string or Date to timestamp in ms
function parseDateMs(d: string | Date): number {
  if (d instanceof Date) return d.getTime();
  const str = String(d).trim().split('T')[0];
  const parts = str.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day).getTime();
  }
  return new Date(str).getTime();
}

// Pre-group sales orders according to scenario parameters (Rolling Horizon, MilkRuns)
export function prepareOrderGroups(
  dataset: Dataset,
  prep: PreAggregatedData,
  scenario: ScenarioParameters
): { groups: PreparedOrderGroup[]; totalOrders: number; eligibleOrdersCount: number; eligiblePallets: number } {
  const isMilkRuns = scenario.MilkRuns === 'YES';
  const horizon = scenario.OrderCombHorizon || 0;
  const minTruckload = scenario.MinTruckload || 26;
  const horizonMs = Math.max(0, horizon) * 86400000;

  const clusterMap = isMilkRuns ? clusterCustomers(dataset.customers, 25) : new Map<string, string>();

  // 1. Partition orders by entity ONLY (combining all SKUs for the customer/cluster in the window)
  const partitionMap = new Map<string, SalesOrder[]>();
  for (const order of dataset.salesOrders) {
    const entityId = isMilkRuns
      ? clusterMap.get(order.Customer_ID) || order.Customer_ID
      : order.Customer_ID;
    const list = partitionMap.get(entityId) || [];
    list.push(order);
    partitionMap.set(entityId, list);
  }

  const groups: PreparedOrderGroup[] = [];
  let eligibleOrdersCount = 0;
  let eligiblePallets = 0;

  // 2. For each entity partition, sort by Requested_Delivery_Date and group using rolling window
  for (const [entityId, orders] of partitionMap.entries()) {
    // Sort chronologically by Requested_Delivery_Date
    orders.sort((a, b) => parseDateMs(a.Requested_Delivery_Date) - parseDateMs(b.Requested_Delivery_Date));

    let i = 0;
    while (i < orders.length) {
      const anchorOrder = orders[i];
      const anchorDateMs = parseDateMs(anchorOrder.Requested_Delivery_Date);
      const windowEndMs = anchorDateMs + horizonMs;

      // Collect all orders within [anchorDateMs, windowEndMs]
      const groupOrders: SalesOrder[] = [anchorOrder];
      let groupQty = anchorOrder.Qty_Pallets;
      let j = i + 1;

      while (j < orders.length) {
        const nextOrder = orders[j];
        const nextDateMs = parseDateMs(nextOrder.Requested_Delivery_Date);
        if (nextDateMs <= windowEndMs) {
          groupOrders.push(nextOrder);
          groupQty += nextOrder.Qty_Pallets;
          j++;
        } else {
          break;
        }
      }

      // Build SKU breakdown for the combined group
      const skuMap = new Map<string, number>();
      for (const ord of groupOrders) {
        skuMap.set(ord.SKU_ID, (skuMap.get(ord.SKU_ID) || 0) + ord.Qty_Pallets);
      }
      const skuBreakdown: Array<{ skuId: string; qty: number }> = Array.from(skuMap.entries()).map(
        ([skuId, qty]) => ({ skuId, qty })
      );

      // Format delivery date as anchor order's delivery date (or latest in group)
      const deliveryDateStr = String(anchorOrder.Requested_Delivery_Date).split('T')[0];
      const sampleCustId = anchorOrder.Customer_ID;
      const sampleDcId = anchorOrder.DC_ID;

      const cust = prep.custMap.get(sampleCustId) || {
        Latitude: 28.5,
        Longitude: 77.2,
        Primary_DC: sampleDcId,
        Customer_ID: sampleCustId,
        Customer_Name: sampleCustId,
      };
      const dcId = cust.Primary_DC || sampleDcId;
      const dc = prep.dcMap.get(dcId) || {
        Latitude: 28.4,
        Longitude: 77.0,
        DC_ID: dcId,
        DC_Name: dcId,
        Godown_Capacity_Pallets: 10000,
      };

      // Find the anchor SKU: the single SKU with the LARGEST quantity in that group (ties broken arbitrarily / first encountered)
      let anchorSku = skuBreakdown[0];
      for (let k = 1; k < skuBreakdown.length; k++) {
        if (skuBreakdown[k].qty > anchorSku.qty) {
          anchorSku = skuBreakdown[k];
        }
      }

      // Pick the factory producing the anchor SKU that is GEOGRAPHICALLY NEAREST to the customer
      const producingFactoryIds = prep.skuProducingFactories.get(anchorSku.skuId) || [];
      const candidateFactories: Factory[] = producingFactoryIds
        .map(id => prep.factoryMap.get(id))
        .filter((f): f is Factory => f !== undefined);

      const candidateList = candidateFactories.length > 0 ? candidateFactories : Array.from(prep.factoryMap.values());

      let bestFactory = candidateList[0];
      let minDdDist = Infinity;

      for (const fac of candidateList) {
        const dist = haversineDistanceKm(fac.Latitude, fac.Longitude, cust.Latitude, cust.Longitude);
        if (dist < minDdDist) {
          minDdDist = dist;
          bestFactory = fac;
        }
      }

      const primaryDist = haversineDistanceKm(bestFactory.Latitude, bestFactory.Longitude, dc.Latitude, dc.Longitude);
      const secondaryDist = haversineDistanceKm(dc.Latitude, dc.Longitude, cust.Latitude, cust.Longitude);
      const ddDist = haversineDistanceKm(bestFactory.Latitude, bestFactory.Longitude, cust.Latitude, cust.Longitude);

      // Costs
      const pcppKey = `${bestFactory.Factory_ID}|${dc.DC_ID}`;
      const pcpp = prep.costCache.pcppMap.get(pcppKey) || (prep.costCache.avgPcppPerKm * primaryDist);
      const scppKey = `${dc.DC_ID}|${cust.Customer_ID}`;
      const scpp = prep.costCache.scppMap.get(scppKey) || (0.12 * secondaryDist + 10);

      // Direct Dispatch Cost Per Pallet = (PCPP / Primary distance km) * 1.1 * DD distance km
      const primaryUnitRate = primaryDist > 0 ? pcpp / primaryDist : prep.costCache.avgPcppPerKm;
      const ddcpp = primaryUnitRate * 1.1 * ddDist;

      // Transport savings per pallet
      const unitTransportSavings = scpp + pcpp - ddcpp;

      // WH savings per pallet
      const dcWhCost = prep.whCostMap.get(dc.DC_ID) || { Handling_In_Cost_Per_Pallet: 3.5, Handling_Out_Cost_Per_Pallet: 3.8, Storage_Cost_Per_Pallet_Per_Week: 2.0 };
      const facWhCost = prep.whCostMap.get(bestFactory.Factory_ID) || { Handling_In_Cost_Per_Pallet: 2.2, Handling_Out_Cost_Per_Pallet: 2.4, Storage_Cost_Per_Pallet_Per_Week: 1.1 };

      const dohDc = scenario.DOH_DC_weeks || 3.5;
      const dohBof = scenario.DOH_BoF_weeks || 1.5;

      const dcWhCostTotal =
        (dcWhCost.Handling_In_Cost_Per_Pallet + dcWhCost.Handling_Out_Cost_Per_Pallet) +
        (1 / 52) * dcWhCost.Storage_Cost_Per_Pallet_Per_Week * dohDc;

      const facWhCostTotal =
        facWhCost.Handling_Out_Cost_Per_Pallet +
        (1 / 52) * facWhCost.Storage_Cost_Per_Pallet_Per_Week * dohBof;

      const unitWhSavings = dcWhCostTotal - facWhCostTotal;

      const unitTotalSavings = unitTransportSavings + unitWhSavings;
      const unitCo2ReductionKg = Math.max(0, (primaryDist + secondaryDist - ddDist) * 0.15);

      const isEligible = groupQty >= minTruckload;
      if (isEligible) {
        eligibleOrdersCount += groupOrders.length;
        eligiblePallets += groupQty;
      }

      const groupId = `grp_${entityId}_${deliveryDateStr}_${i}`;

      groups.push({
        groupId,
        clusterOrCustId: entityId,
        deliveryDate: deliveryDateStr,
        skuBreakdown,
        totalQty: groupQty,
        orders: groupOrders,
        assignedFactoryId: bestFactory.Factory_ID,
        assignedDCId: dc.DC_ID,
        primaryDistKm: primaryDist,
        secondaryDistKm: secondaryDist,
        ddDistKm: ddDist,
        pcpp,
        scpp,
        ddcpp,
        dcWhCost: dcWhCostTotal,
        factoryWhCost: facWhCostTotal,
        unitTransportSavings,
        unitWhSavings,
        unitTotalSavings,
        unitCo2ReductionKg,
      });

      i = j; // Advance to next unprocessed order
    }
  }

  // Sort groups chronologically by delivery date
  groups.sort((a, b) => parseDateMs(a.deliveryDate) - parseDateMs(b.deliveryDate));

  return {
    groups,
    totalOrders: dataset.salesOrders.length,
    eligibleOrdersCount,
    eligiblePallets,
  };
}

// Value Density per Factory-SKU: weighted average unit total savings ($/pallet) for orders drawing on this factory SKU
export function computeValueDensityMap(
  orderGroups: PreparedOrderGroup[],
  prep: PreAggregatedData
): Map<string, number> {
  const valueDensityMap = new Map<string, number>();
  const totalSavingsByKey = new Map<string, number>();
  const totalQtyByKey = new Map<string, number>();

  for (const group of orderGroups) {
    const fId = group.assignedFactoryId;
    for (const item of group.skuBreakdown) {
      const key = `${fId}|${item.skuId}`;
      const savings = item.qty * group.unitTotalSavings;
      totalSavingsByKey.set(key, (totalSavingsByKey.get(key) || 0) + savings);
      totalQtyByKey.set(key, (totalQtyByKey.get(key) || 0) + item.qty);
    }
  }

  for (const key of prep.factorySkuKeys) {
    const totalSavings = totalSavingsByKey.get(key) || 0;
    const totalQty = totalQtyByKey.get(key) || 0;
    const vd = totalQty > 0 ? totalSavings / totalQty : 0;
    valueDensityMap.set(key, vd);
  }

  return valueDensityMap;
}

export interface SimulationResult {
  score: number;
  feasible: boolean;
  totalBofOrders: number;
  totalLosses: number; // Opportunity losses only (profitable groups that could not get enough stock)
  totalUnprofitableDeclined: number; // Groups declined due to non-positive economics
  avgBofStock: number;
  totalTransportSavings: number;
  totalWhSavings: number;
  totalCostSavings: number;
  totalCo2SavedKg: number;
  factoryStats: Map<string, {
    ddOrders: number;
    ddPallets: number;
    losses: number;
    unprofitableDeclined: number;
    transportSavings: number;
    whSavings: number;
    totalSavings: number;
    avgStock: number;
    maxStock: number;
    co2SavedKg: number;
  }>;
  dispatchedGroups: Map<string, number>; // groupId -> dispatchedQty
  dailyLedgers: DailyLedgerPoint[];
}

// Inner Layer: SIMULATE(alphaMap)
export function runSimulation(
  dataset: Dataset,
  prep: PreAggregatedData,
  scenario: ScenarioParameters,
  orderGroups: PreparedOrderGroup[],
  alphaMap: Map<string, number>, // "facId|skuId" -> alpha
  collectDetailedLedger = false,
  valueDensityMap?: Map<string, number>
): SimulationResult {
  const minTruckload = scenario.MinTruckload || 26;
  const useWhCapacity = scenario.UseWHCapacityCons === 'YES';

  // State: BoF ledger for each "facId|skuId"
  const bofStock = new Map<string, number>();
  prep.factorySkuKeys.forEach(k => bofStock.set(k, 0));

  // Factory daily tracking
  const factoryDayStock = new Map<string, number[]>(); // facId -> daily stock array
  prep.factoryMap.forEach((_, fId) => factoryDayStock.set(fId, []));

  // Results
  let totalBofOrders = 0;
  let totalLosses = 0; // Opportunity losses: profitable groups missing stock
  let totalUnprofitableDeclined = 0; // Unprofitable groups declined
  let totalTransportSavings = 0;
  let totalWhSavings = 0;
  let totalCostSavings = 0;
  let totalCo2SavedKg = 0;

  const factoryStats = new Map<string, {
    ddOrders: number;
    ddPallets: number;
    losses: number;
    unprofitableDeclined: number;
    transportSavings: number;
    whSavings: number;
    totalSavings: number;
    avgStock: number;
    maxStock: number;
    co2SavedKg: number;
  }>();

  prep.factoryMap.forEach((f, fId) => {
    factoryStats.set(fId, {
      ddOrders: 0,
      ddPallets: 0,
      losses: 0,
      unprofitableDeclined: 0,
      transportSavings: 0,
      whSavings: 0,
      totalSavings: 0,
      avgStock: 0,
      maxStock: 0,
      co2SavedKg: 0,
    });
  });

  // Pre-grouped data for fast timeline simulation
  const dispatchedGroups = new Map<string, number>();
  const dailyLedgers: DailyLedgerPoint[] = [];

  // Group STOs by date (or lookup from prep)
  const stoByDateMap = prep.stoByDateMap;

  // Group orderGroups by delivery date
  const groupsByDateMap = new Map<string, PreparedOrderGroup[]>();
  for (const g of orderGroups) {
    let list = groupsByDateMap.get(g.deliveryDate);
    if (!list) {
      list = [];
      groupsByDateMap.set(g.deliveryDate, list);
    }
    list.push(g);
  }

  // Running factory total stock for O(1) capacity lookup
  const facTotalStockMap = new Map<string, number>();
  prep.factoryMap.forEach((_, fId) => {
    facTotalStockMap.set(fId, 0);
  });

  // Iterate over all simulated timeline dates
  for (const date of prep.allDates) {
    const dailyInflowByFac = collectDetailedLedger ? new Map<string, number>() : null;
    const dailyDispatchByFac = collectDetailedLedger ? new Map<string, number>() : null;

    // 1. Inflows from STOs occurring on this date
    const stosToday = stoByDateMap.get(date);
    if (stosToday) {
      if (!useWhCapacity) {
        // Unconstrained: standard direct inflow per SKU (alpha * qty)
        for (let i = 0; i < stosToday.length; i++) {
          const sto = stosToday[i];
          const key = `${sto.factoryId}|${sto.skuId}`;
          const alpha = alphaMap.get(key) ?? 0.5;
          const rawInflow = alpha * sto.qty;

          if (rawInflow > 0) {
            const curr = bofStock.get(key) || 0;
            bofStock.set(key, curr + rawInflow);
            facTotalStockMap.set(sto.factoryId, (facTotalStockMap.get(sto.factoryId) || 0) + rawInflow);
          }

          if (collectDetailedLedger && dailyInflowByFac) {
            dailyInflowByFac.set(
              sto.factoryId,
              (dailyInflowByFac.get(sto.factoryId) || 0) + rawInflow
            );
          }
        }
      } else {
        // WH Capacity Constrained: Value-Density Priority Allocation
        // Step 1: For each SKU producing at this factory today, compute requested inflow = alpha * sto.qty
        // (where alpha is bounded by the unconstrained optimal alpha, preventing any single SKU from claiming unlimited demand)
        const stosByFac = new Map<string, Array<{ sto: typeof stosToday[0]; key: string; requestedInflow: number; valueDensity: number }>>();

        for (let i = 0; i < stosToday.length; i++) {
          const sto = stosToday[i];
          const key = `${sto.factoryId}|${sto.skuId}`;
          const alpha = alphaMap.get(key) ?? 0.5;
          const requestedInflow = alpha * sto.qty;
          const vd = valueDensityMap?.get(key) ?? 0;

          let list = stosByFac.get(sto.factoryId);
          if (!list) {
            list = [];
            stosByFac.set(sto.factoryId, list);
          }
          list.push({ sto, key, requestedInflow, valueDensity: vd });
        }

        // Process each factory's daily inflow allocation
        prep.factoryMap.forEach((fac, fId) => {
          const facInflows = stosByFac.get(fId);
          if (!facInflows || facInflows.length === 0) return;

          const capacity = fac.Godown_Capacity_Pallets ?? 1800;
          const currentTotalFacStock = facTotalStockMap.get(fId) || 0;
          let remainingCapacity = Math.max(0, capacity - currentTotalFacStock);

          // Step 2: Sum requested inflows. If they fit in remaining capacity, fulfill all requests completely.
          const totalRequested = facInflows.reduce((sum, item) => sum + item.requestedInflow, 0);

          if (totalRequested <= remainingCapacity) {
            for (const item of facInflows) {
              if (item.requestedInflow > 0) {
                const curr = bofStock.get(item.key) || 0;
                bofStock.set(item.key, curr + item.requestedInflow);
                facTotalStockMap.set(fId, (facTotalStockMap.get(fId) || 0) + item.requestedInflow);
              }
              if (collectDetailedLedger && dailyInflowByFac) {
                dailyInflowByFac.set(
                  fId,
                  (dailyInflowByFac.get(fId) || 0) + item.requestedInflow
                );
              }
            }
          } else {
            // Step 3: If total requested exceeds remaining capacity, allocate in Value-Density order:
            // Give the top-ranked SKU its FULL REQUEST (capped at its requestedInflow = alpha * sto.qty, never unlimited),
            // then move to the next-ranked SKU and give it its full request from remaining room, down the list.
            facInflows.sort((a, b) => {
              if (Math.abs(b.valueDensity - a.valueDensity) > 1e-5) {
                return b.valueDensity - a.valueDensity;
              }
              return a.sto.skuId.localeCompare(b.sto.skuId);
            });

            for (let k = 0; k < facInflows.length; k++) {
              const item = facInflows[k];
              const candidateInflow = Math.min(item.requestedInflow, remainingCapacity);
              remainingCapacity = Math.max(0, remainingCapacity - candidateInflow);

              if (candidateInflow > 0) {
                const curr = bofStock.get(item.key) || 0;
                bofStock.set(item.key, curr + candidateInflow);
                facTotalStockMap.set(fId, (facTotalStockMap.get(fId) || 0) + candidateInflow);
              }

              if (collectDetailedLedger && dailyInflowByFac) {
                dailyInflowByFac.set(
                  fId,
                  (dailyInflowByFac.get(fId) || 0) + candidateInflow
                );
              }
            }
          }
        });
      }
    }

    // 2. Outflows / Shipments for orders delivering on this date
    const groupsToday = groupsByDateMap.get(date);
    if (groupsToday) {
      for (let i = 0; i < groupsToday.length; i++) {
        const group = groupsToday[i];
        const isEligible = group.totalQty >= minTruckload;
        const stats = factoryStats.get(group.assignedFactoryId)!;
        const isProfitable = group.unitTotalSavings > 0;

        if (!isEligible) {
          // Did not meet minimum truckload -> traditional shipment
          // If profitable, this is a truckload size shortfall; if unprofitable, it is unprofitable
          if (isProfitable) {
            stats.losses += group.totalQty;
            totalLosses += group.totalQty;
          } else {
            stats.unprofitableDeclined += group.totalQty;
            totalUnprofitableDeclined += group.totalQty;
          }
          continue;
        }

        // PROFITABILITY GATE: Unprofitable or zero-savings groups must NOT dispatch DD
        if (!isProfitable) {
          stats.unprofitableDeclined += group.totalQty;
          totalUnprofitableDeclined += group.totalQty;
          continue;
        }

        // Check availability across all SKUs in the group breakdown
        let combinedDispatchQty = 0;
        const perSkuDispatch: Array<{ skuId: string; dispatchQty: number }> = [];

        for (let s = 0; s < group.skuBreakdown.length; s++) {
          const item = group.skuBreakdown[s];
          const producers = prep.skuProducingFactories.get(item.skuId) || [];
          const isProduced = producers.includes(group.assignedFactoryId);
          const key = `${group.assignedFactoryId}|${item.skuId}`;
          const available = isProduced ? (bofStock.get(key) || 0) : 0;
          const dispatchQty = Math.min(item.qty, available);
          perSkuDispatch.push({ skuId: item.skuId, dispatchQty });
          combinedDispatchQty += dispatchQty;
        }

        if (combinedDispatchQty >= minTruckload && isProfitable) {
          // Successful DD dispatch: draw down each SKU's ledger
          for (let s = 0; s < perSkuDispatch.length; s++) {
            const { skuId, dispatchQty } = perSkuDispatch[s];
            if (dispatchQty > 0) {
              const key = `${group.assignedFactoryId}|${skuId}`;
              bofStock.set(key, (bofStock.get(key) || 0) - dispatchQty);
            }
          }
          facTotalStockMap.set(
            group.assignedFactoryId,
            (facTotalStockMap.get(group.assignedFactoryId) || 0) - combinedDispatchQty
          );

          if (collectDetailedLedger) {
            dispatchedGroups.set(group.groupId, combinedDispatchQty);
          }

          stats.ddOrders += group.orders.length;
          stats.ddPallets += combinedDispatchQty;
          totalBofOrders += combinedDispatchQty;

          const transSaving = combinedDispatchQty * group.unitTransportSavings;
          const whSaving = combinedDispatchQty * group.unitWhSavings;
          const totalSaving = transSaving + whSaving;
          const co2 = combinedDispatchQty * group.unitCo2ReductionKg;

          stats.transportSavings += transSaving;
          stats.whSavings += whSaving;
          stats.totalSavings += totalSaving;
          stats.co2SavedKg += co2;

          totalTransportSavings += transSaving;
          totalWhSavings += whSaving;
          totalCostSavings += totalSaving;
          totalCo2SavedKg += co2;

          if (collectDetailedLedger && dailyDispatchByFac) {
            dailyDispatchByFac.set(
              group.assignedFactoryId,
              (dailyDispatchByFac.get(group.assignedFactoryId) || 0) + combinedDispatchQty
            );
          }

          // Shortfall goes to opportunity losses (since group is profitable)
          const shortfall = group.totalQty - combinedDispatchQty;
          if (shortfall > 0) {
            stats.losses += shortfall;
            totalLosses += shortfall;
          }
        } else {
          // Failed shipment eligibility floor (available stock < minTruckload)
          // BoF ledger is NOT drawn down; since group is profitable, this is an opportunity loss
          stats.losses += group.totalQty;
          totalLosses += group.totalQty;
        }
      }
    }

    // 3. Record daily factory stock levels for capacity tracking
    prep.factoryMap.forEach((fac, fId) => {
      const facTotalStock = facTotalStockMap.get(fId) || 0;
      factoryDayStock.get(fId)!.push(facTotalStock);

      if (collectDetailedLedger && (dailyLedgers.length < 150 || date.endsWith('-01') || date.endsWith('-15'))) {
        dailyLedgers.push({
          date,
          factoryId: fId,
          bofStock: Math.round(facTotalStock),
          capacity: fac.Godown_Capacity_Pallets,
          utilizationPct: Math.round((facTotalStock / fac.Godown_Capacity_Pallets) * 1000) / 10,
          inflow: Math.round(dailyInflowByFac?.get(fId) || 0),
          dispatch: Math.round(dailyDispatchByFac?.get(fId) || 0),
        });
      }
    });
  }

  // Calculate average BoF stock across simulated horizon
  let sumAvgStockAllFacs = 0;
  prep.factoryMap.forEach((fac, fId) => {
    const days = factoryDayStock.get(fId) || [];
    const avg = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;
    const max = days.length > 0 ? Math.max(...days) : 0;
    const st = factoryStats.get(fId)!;
    st.avgStock = avg;
    st.maxStock = max;
    sumAvgStockAllFacs += avg;
  });

  const avgBofStock = sumAvgStockAllFacs;

  // INTERNAL OPTIMIZER OBJECTIVE SCORE (INTERNAL USE ONLY - NEVER DISPLAYED AS DOLLAR SAVINGS)
  // Score = BOFWeight * SavingsPerPallet * BOFOrders + LossWeight * SavingsPerPallet * Losses + BOFStockWeight * SavingsPerPallet * BOFStock
  // BOFWeight / LossWeight / BOFStockWeight are search-tuning knobs to bias alpha selection against stockouts & excess holding.
  // Note: totalLosses here represents true opportunity losses (profitable loads that were not dispatched), NOT unprofitable declines.
  const unitSavingsRate = totalBofOrders > 0 ? (totalTransportSavings + totalWhSavings) / totalBofOrders : 25;
  const score =
    scenario.BOFWeight * unitSavingsRate * totalBofOrders +
    scenario.LossWeight * unitSavingsRate * totalLosses +
    scenario.BOFStockWeight * unitSavingsRate * avgBofStock;

  return {
    score,
    feasible: true,
    totalBofOrders,
    totalLosses,
    totalUnprofitableDeclined,
    avgBofStock,
    totalTransportSavings,
    totalWhSavings,
    totalCostSavings,
    totalCo2SavedKg,
    factoryStats,
    dispatchedGroups,
    dailyLedgers,
  };
}

function runCoordinateAscent(
  dataset: Dataset,
  prep: PreAggregatedData,
  scenario: ScenarioParameters,
  orderGroups: PreparedOrderGroup[],
  maxAlphaBounds?: Map<string, number>,
  valueDensityMap?: Map<string, number>
): Map<string, number> {
  const alphaMap = new Map<string, number>();

  // 1. Initialize alphas: conservative starting point (0.3) for capacity constrained pass to avoid early jam
  const initialAlphaVal = maxAlphaBounds ? 0.3 : 0.8;
  for (const key of prep.factorySkuKeys) {
    const maxBound = maxAlphaBounds ? (maxAlphaBounds.get(key) ?? 1.0) : 1.0;
    alphaMap.set(key, Math.min(initialAlphaVal, maxBound));
  }

  // 2. Candidate alphas for coordinate search (coarse grid with 0.1 step + fine search with 0.05 step)
  const baseCandidates = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const passes = 8; // 8 full passes for both constrained and unconstrained runs

  const searchKeys = [...prep.factorySkuKeys];
  if (valueDensityMap) {
    searchKeys.sort((a, b) => (valueDensityMap.get(b) ?? 0) - (valueDensityMap.get(a) ?? 0));
  }

  const shouldLogConvergence = scenario.ScnName === 'Scn_01_Base_Direct';
  if (shouldLogConvergence) {
    console.log(`\n[Coordinate Ascent] Starting search for "${scenario.ScnName}" (Passes: ${passes}, Keys: ${prep.factorySkuKeys.length})`);
  }

  for (let pass = 0; pass < passes; pass++) {
    let passImprovement = 0;

    for (const key of searchKeys) {
      const maxBound = maxAlphaBounds ? (maxAlphaBounds.get(key) ?? 1.0) : 1.0;
      const currentAlpha = alphaMap.get(key) ?? Math.min(initialAlphaVal, maxBound);

      let bestAlphaForThis = currentAlpha;
      let bestScoreForThis = -Infinity;

      // Re-test FULL coarse candidate grid on every pass
      const candidates = baseCandidates.filter(c => c <= maxBound + 1e-6);
      if (!candidates.includes(maxBound) && maxBound >= 0 && maxBound <= 1.0) {
        candidates.push(maxBound);
      }
      candidates.sort((a, b) => a - b);

      for (const testA of candidates) {
        alphaMap.set(key, testA);
        const sim = runSimulation(dataset, prep, scenario, orderGroups, alphaMap, false, valueDensityMap);
        if (sim.score > bestScoreForThis) {
          bestScoreForThis = sim.score;
          bestAlphaForThis = testA;
        }
      }

      // Fine localized search around bestAlphaForThis (±0.05 step)
      const fineCandidates = [
        Math.max(0, bestAlphaForThis - 0.05),
        bestAlphaForThis,
        Math.min(maxBound, bestAlphaForThis + 0.05),
      ];

      for (const fineAlpha of fineCandidates) {
        alphaMap.set(key, fineAlpha);
        const sim = runSimulation(dataset, prep, scenario, orderGroups, alphaMap, false, valueDensityMap);
        if (sim.score > bestScoreForThis) {
          bestScoreForThis = sim.score;
          bestAlphaForThis = fineAlpha;
        }
      }

      if (Math.abs(bestAlphaForThis - currentAlpha) > 0.01) {
        passImprovement++;
      }
      alphaMap.set(key, bestAlphaForThis);
    }

    if (shouldLogConvergence) {
      const keySummaries = prep.factorySkuKeys
        .map(k => `${k}: ${alphaMap.get(k)?.toFixed(2)}`)
        .join(' | ');
      console.log(`[Coordinate Ascent] Pass ${pass + 1}/${passes} (changes: ${passImprovement}) -> ${keySummaries}`);
    }

    // Do not exit early on passImprovement === 0 until at least 3-4 full passes have run (pass >= 3 is pass 4)
    if (passImprovement === 0 && pass >= 3) {
      if (shouldLogConvergence) {
        console.log(`[Coordinate Ascent] Search converged and stabilized at Pass ${pass + 1}/${passes}.`);
      }
      break;
    }
  }

  return alphaMap;
}

// Outer Layer: OPTIMIZE alpha_vector
export function optimizeScenario(
  dataset: Dataset,
  prep: PreAggregatedData,
  scenario: ScenarioParameters
): ScenarioRunResult {
  const startTime = Date.now();
  const orderGrouping = prepareOrderGroups(dataset, prep, scenario);
  const useWhCapacity = scenario.UseWHCapacityCons === 'YES';
  const valueDensityMap = computeValueDensityMap(orderGrouping.groups, prep);

  let alphaMap: Map<string, number>;

  if (useWhCapacity) {
    // 1. Solve the unconstrained scenario first to obtain the true upper bound of optimal alphas
    const unconstrainedScenario: ScenarioParameters = {
      ...scenario,
      UseWHCapacityCons: 'NO',
    };
    const unconstrainedAlphaMap = runCoordinateAscent(
      dataset,
      prep,
      unconstrainedScenario,
      orderGrouping.groups
    );

    // 2. Solve the WH-capacity-constrained scenario using unconstrained alphas as upper bounds and value-density guidance
    alphaMap = runCoordinateAscent(
      dataset,
      prep,
      scenario,
      orderGrouping.groups,
      unconstrainedAlphaMap,
      valueDensityMap
    );

    // Strictly enforce invariant: alpha_optimal(WH constraint ON) <= alpha_optimal(WH constraint OFF)
    for (const key of prep.factorySkuKeys) {
      const uncAlpha = unconstrainedAlphaMap.get(key) ?? 1.0;
      const currAlpha = alphaMap.get(key) ?? 0.5;
      if (currAlpha > uncAlpha) {
        alphaMap.set(key, uncAlpha);
      }
    }
  } else {
    // Unconstrained scenario: search the full [0, 1] range using the unified Coordinate Ascent
    alphaMap = runCoordinateAscent(
      dataset,
      prep,
      scenario,
      orderGrouping.groups
    );
  }

  // Final simulation run with optimal alpha_vector, collecting full ledger & details
  const finalSim = runSimulation(dataset, prep, scenario, orderGrouping.groups, alphaMap, true, valueDensityMap);

  // Construct FactorySiteResult list
  let totalCapUtilSum = 0;
  const siteResults: FactorySiteResult[] = dataset.factories.map(fac => {
    const st = finalSim.factoryStats.get(fac.Factory_ID) || {
      ddOrders: 0,
      ddPallets: 0,
      losses: 0,
      transportSavings: 0,
      whSavings: 0,
      totalSavings: 0,
      avgStock: 0,
      maxStock: 0,
      co2SavedKg: 0,
    };

    const eligibleForFac = st.ddPallets + st.losses;
    const fillRateLossPct = eligibleForFac > 0 ? (st.losses / eligibleForFac) * 100 : 0;
    const avgCapUtilPct = fac.Godown_Capacity_Pallets > 0
      ? (st.avgStock / fac.Godown_Capacity_Pallets) * 100
      : 0;
    const maxCapUtilPct = fac.Godown_Capacity_Pallets > 0
      ? (st.maxStock / fac.Godown_Capacity_Pallets) * 100
      : 0;

    totalCapUtilSum += avgCapUtilPct;

    return {
      factoryId: fac.Factory_ID,
      factoryName: fac.Factory_Name,
      capacityPallets: fac.Godown_Capacity_Pallets,
      ddOrdersServed: st.ddOrders,
      ddPallets: Math.round(st.ddPallets),
      traditionalPallets: Math.round(st.losses),
      totalOrdersEvaluated: st.ddOrders + Math.round(st.losses / 26),
      lossesPallets: Math.round(st.losses),
      transportSavings: Math.round(st.transportSavings * 100) / 100,
      whSavings: Math.round(st.whSavings * 100) / 100,
      totalSavings: Math.round(st.totalSavings * 100) / 100,
      fillRateLossPct: Math.round(fillRateLossPct * 10) / 10,
      avgCapacityUtilPct: Math.round(avgCapUtilPct * 10) / 10,
      maxCapacityUtilPct: Math.round(maxCapUtilPct * 10) / 10,
      avgDailyBofStock: Math.round(st.avgStock),
      co2SavedKg: Math.round(st.co2SavedKg * 10) / 10,
    };
  });

  // Construct AlphaEntry list
  const alphaVector: AlphaEntry[] = [];
  for (const [key, alpha] of alphaMap.entries()) {
    const [facId, skuId] = key.split('|');
    const sku = dataset.skuMaster.find(s => s.SKU_ID === skuId);
    const totalSto = dataset.stoData
      .filter(s => s.Factory_ID === facId && s.SKU_ID === skuId)
      .reduce((sum, s) => sum + s.Qty_Pallets, 0);

    alphaVector.push({
      factoryId: facId,
      skuId,
      skuName: sku ? sku.SKU_Name : skuId,
      alpha: Math.round(alpha * 100) / 100,
      totalStoPallets: totalSto,
    });
  }

  // Construct complete individual order evaluation records for the Order Explorer UI & CSV export
  const skuNameMap = new Map<string, string>();
  dataset.skuMaster.forEach(s => skuNameMap.set(s.SKU_ID, s.SKU_Name));

  const sampleOrders: OrderEvaluationDetail[] = [];
  const minTruckload = scenario.MinTruckload || 26;

  for (const group of orderGrouping.groups) {
    const dispatchedQty = finalSim.dispatchedGroups.get(group.groupId) || 0;
    const isDispatched = dispatchedQty >= minTruckload;
    const fac = prep.factoryMap.get(group.assignedFactoryId);
    const dc = prep.dcMap.get(group.assignedDCId);

    for (const order of group.orders) {
      const orderShare = group.totalQty > 0 ? order.Qty_Pallets / group.totalQty : 1;
      const orderDispatchedPallets = isDispatched ? Math.round(dispatchedQty * orderShare) : 0;
      const orderLossPallets = order.Qty_Pallets - orderDispatchedPallets;
      const cust = prep.custMap.get(order.Customer_ID);
      const alphaKey = `${group.assignedFactoryId}|${order.SKU_ID}`;
      const alphaVal = alphaMap.get(alphaKey) ?? 0.5;

      let rejectionReason: string | undefined = undefined;
      if (!isDispatched) {
        if (group.unitTotalSavings <= 0) {
          rejectionReason = `Negative DD economics (unit savings: $${group.unitTotalSavings.toFixed(2)}/pallet)`;
        } else if (group.totalQty < minTruckload) {
          rejectionReason = `Order group combined volume (${group.totalQty}p) < MinTruckload (${minTruckload}p)`;
        } else {
          rejectionReason = `Insufficient BoF factory stock at delivery window (${group.deliveryDate})`;
        }
      }

      sampleOrders.push({
        salesOrder: order.Sales_Order,
        lineItem: order.Line_Item,
        customerId: order.Customer_ID,
        customerName: cust ? cust.Customer_Name : order.Customer_ID,
        skuId: order.SKU_ID,
        skuName: skuNameMap.get(order.SKU_ID) || order.SKU_ID,
        qtyPallets: order.Qty_Pallets,
        deliveryDate: String(order.Requested_Delivery_Date).split('T')[0],
        groupCombinedQty: group.totalQty,
        assignedFactoryId: group.assignedFactoryId,
        assignedFactoryName: fac ? fac.Factory_Name : group.assignedFactoryId,
        assignedDCId: group.assignedDCId,
        assignedDCName: dc ? dc.DC_Name : group.assignedDCId,
        alpha: Math.round(alphaVal * 100) / 100,
        isEligible: group.totalQty >= minTruckload && group.unitTotalSavings > 0,
        dispatchedDD: isDispatched,
        ddDispatchedPallets: orderDispatchedPallets,
        lossPallets: orderLossPallets,
        primaryDistKm: Math.round(group.primaryDistKm * 10) / 10,
        secondaryDistKm: Math.round(group.secondaryDistKm * 10) / 10,
        ddDistKm: Math.round(group.ddDistKm * 10) / 10,
        pcpp: Math.round(group.pcpp * 100) / 100,
        scpp: Math.round(group.scpp * 100) / 100,
        ddcpp: Math.round(group.ddcpp * 100) / 100,
        dcWhCost: Math.round(group.dcWhCost * 100) / 100,
        factoryWhCost: Math.round(group.factoryWhCost * 100) / 100,
        unitTransportSavings: Math.round(group.unitTransportSavings * 100) / 100,
        unitWhSavings: Math.round(group.unitWhSavings * 100) / 100,
        unitTotalSavings: Math.round(group.unitTotalSavings * 100) / 100,
        totalOrderSavings: Math.round(orderDispatchedPallets * group.unitTotalSavings * 100) / 100,
        co2SavedKg: Math.round(orderDispatchedPallets * group.unitCo2ReductionKg * 10) / 10,
        rejectionReason,
      });
    }
  }

  const overallEligiblePallets = finalSim.totalBofOrders + finalSim.totalLosses;
  const fillRateLossPct = overallEligiblePallets > 0
    ? (finalSim.totalLosses / overallEligiblePallets) * 100
    : 0;

  const overallAvgCapacityUtilPct = dataset.factories.length > 0
    ? totalCapUtilSum / dataset.factories.length
    : 0;

  // Explicit log output for diagnostics & auditing
  console.log(`\n======================================================`);
  console.log(`[Optimizer] Scenario: "${scenario.ScnName}"`);
  console.log(`  Config: Horizon=${scenario.OrderCombHorizon}d | MilkRuns=${scenario.MilkRuns} | UseWHCapacityCons=${scenario.UseWHCapacityCons}`);
  console.log(`  Search Tuning Weights: BOFWeight=${scenario.BOFWeight}, LossWeight=${scenario.LossWeight}, BOFStockWeight=${scenario.BOFStockWeight}`);
  console.log(`  -> INTERNAL OPTIMIZER SCORE: ${Math.round(finalSim.score * 100) / 100} (Search Signal Only)`);
  console.log(`  -> ACTUAL REAL DOLLAR SAVINGS: $${Math.round(finalSim.totalCostSavings * 100) / 100} (Transport: $${Math.round(finalSim.totalTransportSavings * 100) / 100}, WH: $${Math.round(finalSim.totalWhSavings * 100) / 100})`);
  console.log(`  -> Volume: DD Dispatched=${Math.round(finalSim.totalBofOrders)} pallets | Opportunity Losses=${Math.round(finalSim.totalLosses)} pallets | Unprofitable Declined=${Math.round(finalSim.totalUnprofitableDeclined)} pallets | Fill-Rate Loss=${Math.round(fillRateLossPct * 10) / 10}%`);
  console.log(`  -> Factory Peak BoF Stock & Capacity Status:`);
  siteResults.forEach(r => {
    const isBinding = r.maxCapacityUtilPct >= 99.9;
    console.log(`     * ${r.factoryId} (${r.factoryName}): Cap=${r.capacityPallets}p | Peak Stock=${Math.round(r.maxCapacityUtilPct * r.capacityPallets / 100)}p (${r.maxCapacityUtilPct}% of godown cap) | Avg Stock=${r.avgDailyBofStock}p (${r.avgCapacityUtilPct}%) | Binding: ${isBinding ? 'YES (Capacity Capped)' : 'NO'}`);
  });
  console.log(`======================================================\n`);

  return {
    scenarioName: scenario.ScnName,
    params: scenario,
    score: Math.round(finalSim.score * 100) / 100,
    feasible: true,
    totalOrdersEvaluated: orderGrouping.totalOrders,
    eligibleOrdersCount: orderGrouping.eligibleOrdersCount,
    eligibleOrdersPct: Math.round((orderGrouping.eligibleOrdersCount / (orderGrouping.totalOrders || 1)) * 1000) / 10,
    eligiblePallets: orderGrouping.eligiblePallets,
    totalDDPallets: Math.round(finalSim.totalBofOrders),
    totalTraditionalPallets: Math.round(finalSim.totalLosses + finalSim.totalUnprofitableDeclined),
    totalLossPallets: Math.round(finalSim.totalLosses),
    totalUnprofitableDeclinedPallets: Math.round(finalSim.totalUnprofitableDeclined),
    totalTransportSavings: Math.round(finalSim.totalTransportSavings * 100) / 100,
    totalWHSavings: Math.round(finalSim.totalWhSavings * 100) / 100,
    totalCostSavings: Math.round(finalSim.totalCostSavings * 100) / 100,
    totalCO2SavedKg: Math.round(finalSim.totalCo2SavedKg * 10) / 10,
    fillRateLossPct: Math.round(fillRateLossPct * 10) / 10,
    overallAvgCapacityUtilPct: Math.round(overallAvgCapacityUtilPct * 10) / 10,
    siteResults,
    alphaVector,
    sampleOrders,
    dailyLedgerSample: finalSim.dailyLedgers,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Generates an RFC-compliant diagnostic CSV string for planners
 */
export function exportScenarioOrdersCSV(result: ScenarioRunResult): string {
  const headers = [
    'Sales_Order',
    'Line_Item',
    'Customer_ID',
    'Customer_Name',
    'SKU_ID',
    'SKU_Name',
    'Requested_Delivery_Date',
    'Order_Qty_Pallets',
    'Group_Combined_Qty_Pallets',
    'Assigned_Factory_ID',
    'Assigned_Factory_Name',
    'Assigned_DC_ID',
    'Assigned_DC_Name',
    'Alpha_Factor_Policy',
    'Primary_Dist_KM',
    'Secondary_Dist_KM',
    'Traditional_Total_Dist_KM',
    'DD_Dist_KM',
    'PCPP_Per_Pallet',
    'SCPP_Per_Pallet',
    'DDCPP_Per_Pallet',
    'DC_WH_Cost_Per_Pallet',
    'Factory_WH_Cost_Per_Pallet',
    'Unit_WH_Savings_Per_Pallet',
    'Unit_Transport_Savings_Per_Pallet',
    'Unit_Total_Savings_Per_Pallet',
    'DD_Eligible',
    'Dispatched_Direct_Dispatch',
    'DD_Dispatched_Pallets',
    'Traditional_Loss_Pallets',
    'Total_Line_Savings_USD',
    'CO2_Reduction_KG',
    'Diagnostic_Status_Reason',
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = result.sampleOrders.map(o => {
    const tradDist = Math.round((o.primaryDistKm + o.secondaryDistKm) * 10) / 10;
    const reason = o.dispatchedDD
      ? 'Dispatched via Direct Dispatch'
      : o.rejectionReason || 'Routed traditionally via DC';

    return [
      escapeCsv(o.salesOrder),
      o.lineItem,
      escapeCsv(o.customerId),
      escapeCsv(o.customerName),
      escapeCsv(o.skuId),
      escapeCsv(o.skuName),
      escapeCsv(o.deliveryDate),
      o.qtyPallets,
      o.groupCombinedQty,
      escapeCsv(o.assignedFactoryId),
      escapeCsv(o.assignedFactoryName),
      escapeCsv(o.assignedDCId),
      escapeCsv(o.assignedDCName),
      o.alpha,
      o.primaryDistKm,
      o.secondaryDistKm,
      tradDist,
      o.ddDistKm,
      o.pcpp,
      o.scpp,
      o.ddcpp,
      o.dcWhCost,
      o.factoryWhCost,
      o.unitWhSavings,
      o.unitTransportSavings,
      o.unitTotalSavings,
      o.isEligible ? 'YES' : 'NO',
      o.dispatchedDD ? 'YES' : 'NO',
      o.ddDispatchedPallets,
      o.lossPallets,
      o.totalOrderSavings,
      o.co2SavedKg,
      escapeCsv(reason),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
