import React, { useEffect, useState, useMemo } from 'react';
import {
  DatasetStatus,
  ScenarioParameters,
  ScenarioRunResult,
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { SiteBreakdownTable } from './components/SiteBreakdownTable';
import { ScenarioComparisonChart } from './components/ScenarioComparisonChart';
import { ScenarioPerformanceTable } from './components/ScenarioPerformanceTable';
import { VolumeComparisonChart } from './components/VolumeComparisonChart';
import { AlphaPolicyInspector } from './components/AlphaPolicyInspector';
import { OrderExplorer } from './components/OrderExplorerModal';
import { GlossaryView } from './components/GlossaryView';
import { HowItWorksModal } from './components/HowItWorksModal';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<DatasetStatus | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioParameters[]>([]);
  const [selectedScenarioName, setSelectedScenarioName] = useState<string>('Scn_01_Base_Direct');
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('ALL');
  const [activeResult, setActiveResult] = useState<ScenarioRunResult | null>(null);
  const [allResults, setAllResults] = useState<ScenarioRunResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [runningAll, setRunningAll] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scenarios' | 'alphas' | 'orders' | 'glossary'>('dashboard');
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Fetch status and scenarios in parallel
      const [statusRes, scenariosRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/scenarios'),
      ]);

      const statusData = await statusRes.json();
      const scenariosData: ScenarioParameters[] = await scenariosRes.json();

      setStatus(statusData);
      setScenarios(scenariosData);

      const defaultScn = scenariosData[0]?.ScnName || 'Scn_01_Base_Direct';
      setSelectedScenarioName(defaultScn);

      // Fetch result for default scenario
      const resultRes = await fetch(`/api/results/${encodeURIComponent(defaultScn)}`);
      if (resultRes.ok) {
        const resData = await resultRes.json();
        setActiveResult(resData);
      }

      // Fetch all cached results
      const allRes = await fetch('/api/results-all');
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllResults(allData);
      }
    } catch (err: any) {
      console.error('Initial data fetch error:', err);
      setErrorMsg('Failed to load initial simulation data. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Extract available factories for top filter dropdown
  const availableFactories = useMemo(() => {
    if (activeResult?.siteResults && activeResult.siteResults.length > 0) {
      return activeResult.siteResults.map(s => ({
        id: s.factoryId,
        name: s.factoryName,
      }));
    }
    return [
      { id: 'FAC-01', name: 'Plant 1 - Northern Hub (FAC-01)' },
      { id: 'FAC-02', name: 'Plant 2 - Western Plant (FAC-02)' },
      { id: 'FAC-03', name: 'Plant 3 - Southern Works (FAC-03)' },
      { id: 'FAC-04', name: 'Plant 4 - Eastern Complex (FAC-04)' },
    ];
  }, [activeResult]);

  // Run single scenario
  const handleRunScenario = async (targetName?: string) => {
    const scnName = targetName || selectedScenarioName;
    try {
      setRunning(true);
      setErrorMsg(null);

      const res = await fetch('/api/scenarios/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioName: scnName }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to run scenario optimization');
      }

      const resultData: ScenarioRunResult = await res.json();
      setActiveResult(resultData);
      setSelectedScenarioName(scnName);

      // Update in scenarios list
      setScenarios(prev =>
        prev.map(s =>
          s.ScnName === scnName
            ? {
                ...s,
                hasResult: true,
                totalCostSavings: resultData.totalCostSavings,
                totalDDPallets: resultData.totalDDPallets,
                eligibleOrdersPct: resultData.eligibleOrdersPct,
                fillRateLossPct: resultData.fillRateLossPct,
              }
            : s
        )
      );

      // Update in allResults
      setAllResults(prev => {
        const filtered = prev.filter(r => r.scenarioName !== scnName);
        return [...filtered, resultData];
      });
    } catch (err: any) {
      console.error('Run scenario error:', err);
      setErrorMsg(err.message || 'Error running scenario optimization');
    } finally {
      setRunning(false);
    }
  };

  // Select a scenario from dropdown or chart
  const handleSelectScenario = async (name: string) => {
    setSelectedScenarioName(name);
    try {
      setRunning(true);
      const res = await fetch(`/api/results/${encodeURIComponent(name)}`);
      if (res.ok) {
        const resultData: ScenarioRunResult = await res.json();
        setActiveResult(resultData);
        setAllResults(prev => {
          const filtered = prev.filter(r => r.scenarioName !== resultData.scenarioName);
          return [...filtered, resultData];
        });
      } else {
        await handleRunScenario(name);
      }
    } catch (err: any) {
      console.error('Select scenario error:', err);
      const existing = allResults.find(r => r.scenarioName === name);
      if (existing) setActiveResult(existing);
    } finally {
      setRunning(false);
    }
  };

  // Run all scenarios in batch
  const handleRunAll = async () => {
    try {
      setRunningAll(true);
      setErrorMsg(null);

      const res = await fetch('/api/scenarios/run-all', {
        method: 'POST',
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to run all scenarios');
      }

      const resultsList: ScenarioRunResult[] = await res.json();
      setAllResults(resultsList);

      const match = resultsList.find(r => r.scenarioName === selectedScenarioName) || resultsList[0];
      if (match) {
        setActiveResult(match);
        setSelectedScenarioName(match.scenarioName);
      }

      const scnRes = await fetch('/api/scenarios');
      const scnData = await scnRes.json();
      setScenarios(scnData);
    } catch (err: any) {
      console.error('Run all error:', err);
      setErrorMsg(err.message || 'Error running all scenario optimizations');
    } finally {
      setRunningAll(false);
    }
  };

  // Reset to default sample dataset
  const handleResetSample = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/reset-sample', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset dataset');

      await fetchInitialData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset to sample data');
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel Workbook Upload
  const handleUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'File upload failed');
    }

    await fetchInitialData();
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] text-slate-900 flex flex-col font-sans selection:bg-[#b45309] selection:text-white">
      {/* Top Bar with Light Cream Theme and Scenario & Factory Filter Dropdowns */}
      <Header
        status={status}
        isRunning={running}
        isRunningAll={runningAll}
        onResetSample={handleResetSample}
        onRunAll={handleRunAll}
        onOpenHowItWorks={() => setShowHowItWorks(true)}
        scenarios={scenarios}
        selectedScenario={selectedScenarioName}
        onSelectScenario={handleSelectScenario}
        availableFactories={availableFactories}
        selectedFactory={selectedFactoryId}
        onSelectFactory={setSelectedFactoryId}
      />

      {/* App Shell Layout: Left Sidebar Navigation + Main Content Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scenarios={scenarios}
          selectedScenario={selectedScenarioName}
          onSelectScenario={handleSelectScenario}
          onRunScenario={() => handleRunScenario()}
          onUploadFile={handleUploadFile}
          isRunning={running || runningAll}
          status={status}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 flex flex-col gap-6 overflow-y-auto bg-[#faf8f4]">
          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="flex-1 font-medium">{errorMsg}</div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-700 hover:text-rose-900 font-bold text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <div className="bg-white border border-[#e8e2d8] rounded-xl p-16 flex flex-col items-center justify-center gap-3 shadow-2xs">
              <Loader2 className="w-8 h-8 text-[#b45309] animate-spin" />
              <div className="text-sm font-bold text-slate-900">
                Initializing Simulation Engine & Loading Data...
              </div>
              <p className="text-xs text-slate-500">Loading master records and precomputing baseline network</p>
            </div>
          ) : activeTab === 'glossary' ? (
            /* Logistics Planner Glossary Page */
            <GlossaryView />
          ) : activeResult ? (
            <div className="space-y-6">
              {/* Tab 1: Dashboard KPIs & Site Table */}
              {activeTab === 'dashboard' && (
                <>
                  <SummaryCards result={activeResult} selectedFactoryId={selectedFactoryId} />

                  <SiteBreakdownTable
                    siteResults={activeResult.siteResults}
                    scenarioName={activeResult.scenarioName}
                    useWHCapacityCons={activeResult.params.UseWHCapacityCons === 'YES'}
                    selectedFactoryId={selectedFactoryId}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ScenarioComparisonChart
                      scenarios={scenarios}
                      allResults={allResults}
                      activeScenarioName={selectedScenarioName}
                      onSelectScenario={handleSelectScenario}
                    />
                    <VolumeComparisonChart
                      siteResults={activeResult.siteResults}
                      selectedFactoryId={selectedFactoryId}
                    />
                  </div>
                </>
              )}

              {/* Tab 2: Scenario Benchmarking */}
              {activeTab === 'scenarios' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ScenarioComparisonChart
                      scenarios={scenarios}
                      allResults={allResults}
                      activeScenarioName={selectedScenarioName}
                      onSelectScenario={handleSelectScenario}
                    />
                    <VolumeComparisonChart
                      siteResults={activeResult.siteResults}
                      selectedFactoryId={selectedFactoryId}
                    />
                  </div>

                  <ScenarioPerformanceTable
                    scenarios={scenarios}
                    allResults={allResults}
                    activeScenarioName={selectedScenarioName}
                    onSelectScenario={handleSelectScenario}
                    onRunAll={handleRunAll}
                    isRunningAll={runningAll}
                  />
                </div>
              )}

              {/* Tab 3: Optimal Policy Variables (Alpha) */}
              {activeTab === 'alphas' && (
                <AlphaPolicyInspector
                  alphaVector={activeResult.alphaVector}
                  siteResults={activeResult.siteResults}
                  scenarioName={activeResult.scenarioName}
                  selectedFactoryId={selectedFactoryId}
                />
              )}

              {/* Tab 4: Sales Order Diagnostics & CSV Export */}
              {activeTab === 'orders' && (
                <OrderExplorer
                  orders={activeResult.sampleOrders}
                  minTruckload={activeResult.params.MinTruckload}
                  scenarioName={activeResult.scenarioName}
                  selectedFactoryId={selectedFactoryId}
                />
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              No results available. Please run optimization.
            </div>
          )}
        </main>
      </div>

      {/* How it Works / Algorithm Specs Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />
    </div>
  );
}
