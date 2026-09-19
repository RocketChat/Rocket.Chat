const fs = require('fs');
const metrics = require('./metrics');

const [name, profile, resultFile] = process.argv.slice(2);
const resultFilePath = resultFile || 'result.json';

if (!fs.existsSync(resultFilePath)) {
  console.error(`Error: ${resultFilePath} not found`);
  process.exit(1);
}

const base = fs.existsSync('baseline.json') 
  ? JSON.parse(fs.readFileSync('baseline.json'))
  : { metrics: {} };
const curr = JSON.parse(fs.readFileSync(resultFilePath));

if (!curr || !curr.metrics) {
  console.error(`Error: ${resultFilePath} does not have expected structure`);
  console.error('Expected: { metrics: { ... } }');
  console.error('Got:', JSON.stringify(Object.keys(curr || {}), null, 2));
  process.exit(1);
}

const threshold = Number(process.env.THRESHOLD || 10);

const result = {
  name,
  profile,
  metrics: [],
  regression: false,
};

for (const m of metrics) {
  // k6 summary export structure: metrics[metricName][fieldName]
  // No "values" wrapper in the JSON structure
  const b = base.metrics?.[m.metric]?.[m.field];
  const c = curr.metrics?.[m.metric]?.[m.field];
  
  // Always include the metric, even if current value is null
  // This ensures PR results are always shown
  let delta = null;
  if (b != null && b !== 0 && c != null) {
    delta = ((c - b) / b) * 100;
    if (delta > threshold) {
      result.regression = true;
    }
  }

  result.metrics.push({
    name: m.name,
    base: b ?? null,
    curr: c ?? null,
    delta,
  });
}

// Always read the latest state of report.json to ensure we concatenate correctly
let report = [];
if (fs.existsSync('report.json')) {
  try {
    const content = fs.readFileSync('report.json', 'utf8');
    if (content.trim()) {
      report = JSON.parse(content);
    }
  } catch (e) {
    console.warn('Warning: Could not parse existing report.json, starting fresh:', e.message);
    report = [];
  }
}

// Ensure report is an array
if (!Array.isArray(report)) {
  report = [];
}

report.push(result);
fs.writeFileSync('report.json', JSON.stringify(report, null, 2));

if (result.regression) {
  process.exitCode = 1;
}
