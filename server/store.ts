import { Dataset, ScenarioRunResult, ScenarioParameters } from './types.js';
import { loadDefaultDataset } from './defaultDatasetLoader.js';
import { generateSyntheticDataset } from './syntheticData.js';
import { prepareData, optimizeScenario, exportScenarioOrdersCSV } from './optimizerEngine.js';

class DataStore {
  private dataset: Dataset;
  private resultsCache: Map<string, ScenarioRunResult> = new Map();
  private isRunningAll = false;

  constructor() {
    try {
      this.dataset = loadDefaultDataset();
      console.log(`Initialized DataStore with User Uploaded Dataset (${this.dataset.salesOrders.length} sales orders)`);
    } catch (err) {
      console.error('Failed to load default uploaded dataset, falling back to synthetic:', err);
      this.dataset = generateSyntheticDataset();
    }
  }

  private getScenarioCacheKey(s: ScenarioParameters): string {
    return `${s.ScnName}::h=${s.OrderCombHorizon}::mr=${s.MilkRuns}::wh=${s.UseWHCapacityCons}::tl=${s.MinTruckload}::bw=${s.BOFWeight}::lw=${s.LossWeight}::sw=${s.BOFStockWeight}`;
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/[\s_\-]+/g, '');
  }

  public findScenario(scenarioName: string): ScenarioParameters | undefined {
    if (!scenarioName) return undefined;
    const trimmed = scenarioName.trim();
    // 1. Exact match
    let match = this.dataset.scenarios.find(s => s.ScnName === trimmed);
    if (match) return match;

    // 2. Case-insensitive match
    match = this.dataset.scenarios.find(s => s.ScnName.toLowerCase() === trimmed.toLowerCase());
    if (match) return match;

    // 3. Normalized alphanumeric match
    const norm = this.normalizeName(scenarioName);
    match = this.dataset.scenarios.find(s => this.normalizeName(s.ScnName) === norm);
    if (match) return match;

    // 4. Substring / contains match
    match = this.dataset.scenarios.find(
      s => this.normalizeName(s.ScnName).includes(norm) || norm.includes(this.normalizeName(s.ScnName))
    );
    if (match) return match;

    // 5. Index match (e.g. "01", "1", "Scn_01")
    const numMatch = scenarioName.match(/\d+/);
    if (numMatch) {
      const idx = parseInt(numMatch[0], 10) - 1;
      if (idx >= 0 && idx < this.dataset.scenarios.length) {
        return this.dataset.scenarios[idx];
      }
    }

    return undefined;
  }

  public precomputeAllScenarios(): void {
    try {
      const prep = prepareData(this.dataset);
      for (const scenario of this.dataset.scenarios) {
        const result = optimizeScenario(this.dataset, prep, scenario);
        const key = this.getScenarioCacheKey(scenario);
        this.resultsCache.set(key, result);
        this.resultsCache.set(scenario.ScnName, result);
      }
    } catch (err) {
      console.error('Error precomputing scenarios:', err);
    }
  }

  public getDataset(): Dataset {
    return this.dataset;
  }

  public setDataset(newDataset: Dataset): void {
    this.dataset = newDataset;
    this.resultsCache.clear();
    this.precomputeAllScenarios();
  }

  public resetToSample(): void {
    this.dataset = generateSyntheticDataset();
    this.resultsCache.clear();
    this.precomputeAllScenarios();
  }

  public getStatus() {
    return {
      sourceName: this.dataset.sourceName || 'Synthetic Dataset',
      loadedAt: this.dataset.loadedAt || new Date().toISOString(),
      counts: {
        factories: this.dataset.factories.length,
        dcs: this.dataset.dcs.length,
        customers: this.dataset.customers.length,
        skuMaster: this.dataset.skuMaster.length,
        salesOrders: this.dataset.salesOrders.length,
        stoData: this.dataset.stoData.length,
        primaryCosts: this.dataset.primaryCosts.length,
        secondaryCosts: this.dataset.secondaryCosts.length,
        whCosts: this.dataset.whCosts.length,
        scenarios: this.dataset.scenarios.length,
      },
      cachedScenarioRuns: this.dataset.scenarios.map(s => s.ScnName),
    };
  }

  public getScenarios() {
    return this.dataset.scenarios.map(s => {
      const key = this.getScenarioCacheKey(s);
      const cached = this.resultsCache.get(key) || this.resultsCache.get(s.ScnName);
      return {
        ...s,
        hasResult: !!cached,
        totalCostSavings: cached?.totalCostSavings ?? null,
        totalDDPallets: cached?.totalDDPallets ?? null,
        eligibleOrdersPct: cached?.eligibleOrdersPct ?? null,
        fillRateLossPct: cached?.fillRateLossPct ?? null,
      };
    });
  }

  public runScenarioSync(scenarioName: string): ScenarioRunResult {
    const scenario = this.findScenario(scenarioName);
    if (!scenario) {
      throw new Error(`Scenario '${scenarioName}' not found in dataset with ${this.dataset.scenarios.length} scenarios.`);
    }

    const prep = prepareData(this.dataset);
    const result = optimizeScenario(this.dataset, prep, scenario);
    const key = this.getScenarioCacheKey(scenario);
    this.resultsCache.set(key, result);
    this.resultsCache.set(scenario.ScnName, result);
    return result;
  }

  public async runAllScenarios(): Promise<ScenarioRunResult[]> {
    this.isRunningAll = true;
    const prep = prepareData(this.dataset);
    const results: ScenarioRunResult[] = [];

    for (const scenario of this.dataset.scenarios) {
      const res = optimizeScenario(this.dataset, prep, scenario);
      const key = this.getScenarioCacheKey(scenario);
      this.resultsCache.set(key, res);
      this.resultsCache.set(scenario.ScnName, res);
      results.push(res);
    }

    this.isRunningAll = false;
    return results;
  }

  public getScenarioResult(scenarioName: string): ScenarioRunResult | undefined {
    const scenario = this.findScenario(scenarioName);
    if (!scenario) return undefined;
    const key = this.getScenarioCacheKey(scenario);
    const cached = this.resultsCache.get(key) || this.resultsCache.get(scenario.ScnName);
    if (cached) return cached;
    return this.runScenarioSync(scenario.ScnName);
  }

  public getAllResults(): ScenarioRunResult[] {
    const results: ScenarioRunResult[] = [];
    const prep = prepareData(this.dataset);
    for (const scenario of this.dataset.scenarios) {
      const key = this.getScenarioCacheKey(scenario);
      let res = this.resultsCache.get(key) || this.resultsCache.get(scenario.ScnName);
      if (!res) {
        res = optimizeScenario(this.dataset, prep, scenario);
        this.resultsCache.set(key, res);
        this.resultsCache.set(scenario.ScnName, res);
      }
      results.push(res);
    }
    return results;
  }

  public generateSiteResultsCsv(scenarioName: string): string {
    const scenario = this.findScenario(scenarioName);
    const targetName = scenario ? scenario.ScnName : scenarioName;
    const result = this.resultsCache.get(targetName) || this.runScenarioSync(targetName);
    const headers = [
      'Factory_ID',
      'Factory_Name',
      'Godown_Capacity_Pallets',
      'DD_Orders_Served',
      'DD_Pallets_Dispatched',
      'Traditional_Pallets',
      'Losses_Pallets',
      'Transport_Savings_USD',
      'WH_Savings_USD',
      'Total_Cost_Savings_USD',
      'Fill_Rate_Loss_Pct',
      'Avg_Capacity_Utilization_Pct',
      'Max_Capacity_Utilization_Pct',
      'Avg_Daily_BoF_Stock',
      'CO2_Saved_Kg',
    ];

    const rows = result.siteResults.map(r => [
      `"${r.factoryId}"`,
      `"${r.factoryName}"`,
      r.capacityPallets,
      r.ddOrdersServed,
      r.ddPallets,
      r.traditionalPallets,
      r.lossesPallets,
      r.transportSavings,
      r.whSavings,
      r.totalSavings,
      r.fillRateLossPct,
      r.avgCapacityUtilPct,
      r.maxCapacityUtilPct,
      r.avgDailyBofStock,
      r.co2SavedKg,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  public generateOrderDiagnosticsCsv(scenarioName: string): string {
    const scenario = this.findScenario(scenarioName);
    const targetName = scenario ? scenario.ScnName : scenarioName;
    const result = this.resultsCache.get(targetName) || this.runScenarioSync(targetName);
    return exportScenarioOrdersCSV(result);
  }
}

export const store = new DataStore();
