import express from 'express';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import { parseExcelWorkbook } from './server/excelParser.js';
import { exportDatasetToExcelBuffer } from './server/excelExporter.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get current dataset status
app.get('/api/status', (req, res) => {
  try {
    const status = store.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get scenario list with summary metrics
app.get('/api/scenarios', (req, res) => {
  try {
    const scenarios = store.getScenarios();
    res.json(scenarios);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run single scenario
app.post('/api/scenarios/run', (req, res) => {
  try {
    const { scenarioName } = req.body;
    if (!scenarioName) {
      return res.status(400).json({ error: 'scenarioName is required' });
    }
    const result = store.runScenarioSync(scenarioName);
    res.json(result);
  } catch (err: any) {
    console.error('Scenario run error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Run all scenarios
app.post('/api/scenarios/run-all', async (req, res) => {
  try {
    const results = await store.runAllScenarios();
    res.json(results);
  } catch (err: any) {
    console.error('Run all error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get results for a scenario
app.get('/api/results/:scenarioName', (req, res) => {
  try {
    const { scenarioName } = req.params;
    let result = store.getScenarioResult(scenarioName);
    if (!result) {
      result = store.runScenarioSync(scenarioName);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all cached results (for multi-scenario comparison chart)
app.get('/api/results-all', (req, res) => {
  try {
    const results = store.getAllResults();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Excel Workbook
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const originalName = req.file.originalname || 'DD_Synthetic_Data.xlsx';
    const dataset = await parseExcelWorkbook(req.file.buffer, originalName);

    // Validate essential sheets
    if (dataset.factories.length === 0) {
      return res.status(400).json({ error: 'Missing or empty "Factories" sheet' });
    }
    if (dataset.salesOrders.length === 0) {
      return res.status(400).json({ error: 'Missing or empty "Sales_Orders" sheet' });
    }
    if (dataset.stoData.length === 0) {
      return res.status(400).json({ error: 'Missing or empty "STO_Data" sheet' });
    }

    store.setDataset(dataset);

    res.json({
      success: true,
      message: `Successfully parsed ${originalName}`,
      status: store.getStatus(),
    });
  } catch (err: any) {
    console.error('Upload parse error:', err);
    res.status(500).json({ error: `Failed to parse Excel workbook: ${err.message}` });
  }
});

// Reset to synthetic sample
app.post('/api/reset-sample', (req, res) => {
  try {
    store.resetToSample();
    res.json({
      success: true,
      message: 'Reset to default synthetic dataset',
      status: store.getStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export complete currently loaded dataset as Excel workbook
app.get('/api/export/dataset-excel', async (req, res) => {
  try {
    const ds = store.getDataset();
    const buffer = await exportDatasetToExcelBuffer(ds);
    const filename = ds.sourceName && ds.sourceName.endsWith('.xlsx')
      ? `Active_${ds.sourceName}`
      : 'Current_Active_Dataset.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('Export dataset excel error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export complete currently loaded dataset as JSON
app.get('/api/export/dataset-json', (req, res) => {
  try {
    const ds = store.getDataset();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="Current_Active_Dataset.json"');
    res.json(ds);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export site breakdown as CSV
app.get('/api/export/csv/:scenarioName', (req, res) => {
  try {
    const { scenarioName } = req.params;
    const csv = store.generateSiteResultsCsv(scenarioName);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Site_Breakdown_${scenarioName}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export sales order line item level diagnostics as CSV for planners
app.get('/api/export/order-diagnostics/:scenarioName', (req, res) => {
  try {
    const { scenarioName } = req.params;
    const csv = store.generateOrderDiagnosticsCsv(scenarioName);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${scenarioName}_Order_Level_Diagnostics.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Network Graph Data (Factories, DCs, Customers, Lanes)
app.get('/api/network-data', (req, res) => {
  try {
    const ds = store.getDataset();
    res.json({
      factories: ds.factories,
      dcs: ds.dcs,
      customers: ds.customers.slice(0, 30), // Sample for visual clarity
      skuMaster: ds.skuMaster,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Direct Dispatch Optimizer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
