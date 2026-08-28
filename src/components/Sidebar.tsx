import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  BarChart2,
  Sliders,
  BookOpen,
} from 'lucide-react';
import { ScenarioParameters, DatasetStatus } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'scenarios' | 'alphas' | 'orders' | 'glossary';
  onTabChange: (tab: 'dashboard' | 'scenarios' | 'alphas' | 'orders' | 'glossary') => void;
  scenarios: ScenarioParameters[];
  selectedScenario: string;
  onSelectScenario: (name: string) => void;
  onRunScenario: () => void;
  onUploadFile: (file: File) => Promise<void>;
  isRunning: boolean;
  status: DatasetStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onUploadFile,
  status,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadError('Please upload an Excel workbook (.xlsx or .xls)');
      return;
    }
    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);
    try {
      await onUploadFile(file);
      setUploadSuccess(`Successfully uploaded ${file.name}`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-full lg:w-68 shrink-0 bg-[#faf8f4] border-r border-[#e8e2d8] p-4 sm:p-5 flex flex-col justify-between gap-6 overflow-y-auto">
      {/* 1. Primary Navigation Menu */}
      <div className="flex flex-col gap-4">
        <div className="text-[11px] font-bold text-[#8c7b6b] uppercase tracking-wider px-1 flex items-center justify-between">
          <span>Navigation</span>
          <span className="text-[10px] bg-[#ede7dc] text-[#6e5d4e] px-1.5 py-0.5 rounded font-medium">5 Views</span>
        </div>
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
              activeTab === 'dashboard'
                ? 'bg-[#b45309] text-white shadow-2xs font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-[#f0ebe1]'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-white' : 'text-[#b45309]'}`} />
            <span>KPIs & Site Breakdown</span>
          </button>

          <button
            onClick={() => onTabChange('scenarios')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
              activeTab === 'scenarios'
                ? 'bg-[#b45309] text-white shadow-2xs font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-[#f0ebe1]'
            }`}
          >
            <BarChart2 className={`w-4 h-4 shrink-0 ${activeTab === 'scenarios' ? 'text-white' : 'text-[#b45309]'}`} />
            <span>Scenario Benchmarking</span>
          </button>

          <button
            onClick={() => onTabChange('alphas')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
              activeTab === 'alphas'
                ? 'bg-[#b45309] text-white shadow-2xs font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-[#f0ebe1]'
            }`}
          >
            <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'alphas' ? 'text-white' : 'text-[#b45309]'}`} />
            <span>Optimal Policies (α)</span>
          </button>

          <button
            onClick={() => onTabChange('orders')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
              activeTab === 'orders'
                ? 'bg-[#b45309] text-white shadow-2xs font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-[#f0ebe1]'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-white' : 'text-[#b45309]'}`} />
            <span>Order Diagnostics & Export</span>
          </button>

          <button
            onClick={() => onTabChange('glossary')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer text-left ${
              activeTab === 'glossary'
                ? 'bg-[#b45309] text-white shadow-2xs font-bold'
                : 'text-slate-700 hover:text-slate-900 hover:bg-[#f0ebe1]'
            }`}
          >
            <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'glossary' ? 'text-white' : 'text-[#b45309]'}`} />
            <div className="flex items-center justify-between w-full">
              <span>Glossary & Terms</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeTab === 'glossary' ? 'bg-white/20 text-white' : 'bg-[#e8e0d2] text-[#635345]'
              }`}>
                Guide
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* 2. Workbook Upload & Data Registry */}
      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-bold text-[#8c7b6b] uppercase tracking-wider px-1">
          Data Management
        </div>

        <div className="bg-white border border-[#e8e2d8] rounded-xl p-3.5 shadow-2xs flex flex-col gap-3">
          {/* Upload Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 ${
              dragActive
                ? 'border-[#b45309] bg-[#fbf6ee] text-[#b45309]'
                : 'border-[#dfd8cc] hover:border-[#b45309] bg-[#faf8f4] text-slate-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className={`w-5 h-5 ${uploading ? 'animate-bounce text-[#b45309]' : 'text-[#9c7d5c]'}`} />
            <span className="text-xs font-semibold text-slate-800">
              {uploading ? 'Uploading...' : 'Upload Excel Workbook'}
            </span>
            <span className="text-[10px] text-slate-400">.xlsx or .xls</span>
          </div>

          {uploadSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span className="truncate">{uploadError}</span>
            </div>
          )}

          {/* Master Data Registry Counts */}
          {status && (
            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
              <div className="bg-[#fcfbf9] p-2 rounded-lg border border-[#eee8df]">
                <span className="text-slate-500 block text-[10px]">Factories</span>
                <span className="font-bold text-slate-900">{status.counts.factories}</span>
              </div>
              <div className="bg-[#fcfbf9] p-2 rounded-lg border border-[#eee8df]">
                <span className="text-slate-500 block text-[10px]">DCs</span>
                <span className="font-bold text-slate-900">{status.counts.dcs}</span>
              </div>
              <div className="bg-[#fcfbf9] p-2 rounded-lg border border-[#eee8df]">
                <span className="text-slate-500 block text-[10px]">Customers</span>
                <span className="font-bold text-slate-900">{status.counts.customers}</span>
              </div>
              <div className="bg-[#fcfbf9] p-2 rounded-lg border border-[#eee8df]">
                <span className="text-slate-500 block text-[10px]">SKUs</span>
                <span className="font-bold text-slate-900">{status.counts.skuMaster}</span>
              </div>
            </div>
          )}

          {/* Direct Download Dataset Links */}
          <div className="pt-2 border-t border-[#ede7dc] flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Download Active Dataset</span>
            <div className="flex items-center gap-2">
              <a
                href="/api/export/dataset-excel"
                download="Active_Dataset.xlsx"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#f5f1eb] hover:bg-[#ede5d8] text-slate-800 border border-[#ded5c7] py-1.5 px-2 rounded-lg text-[11px] font-semibold transition"
                title="Download active dataset with all 10 sheets as Excel workbook (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Excel (.xlsx)</span>
              </a>
              <a
                href="/api/export/dataset-json"
                download="Active_Dataset.json"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#f5f1eb] hover:bg-[#ede5d8] text-slate-800 border border-[#ded5c7] py-1.5 px-2 rounded-lg text-[11px] font-semibold transition"
                title="Download complete dataset as raw JSON"
              >
                <span>JSON</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
