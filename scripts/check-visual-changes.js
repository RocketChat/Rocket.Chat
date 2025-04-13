const { execSync } = require('child_process');
const path = require('path');

function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD').toString();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting changed files:', error);
    return [];
  }
}

function shouldRunVisualTests(changedFiles) {
  const relevantPatterns = [
    /\.stories\.(js|jsx|ts|tsx)$/,
    /\.component\.(js|jsx|ts|tsx)$/,
    /\.css$/,
    /\.scss$/,
    /\.less$/
  ];

  return changedFiles.some(file => 
    relevantPatterns.some(pattern => pattern.test(file))
  );
}

const changedFiles = getChangedFiles();
const shouldRun = shouldRunVisualTests(changedFiles);

if (shouldRun) {
  console.log('Visual changes detected. Running Loki tests...');
  process.exit(0);
} else {
  console.log('No visual changes detected. Skipping Loki tests.');
  process.exit(1);
}
