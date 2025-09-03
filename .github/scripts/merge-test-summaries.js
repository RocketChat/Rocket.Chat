#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Merges multiple test summary markdown files into a single comprehensive summary
 * and outputs it as a GitHub Actions job summary
 */

function parseMarkdownTable(content) {
  const lines = content.split('\n');
  const suites = new Map();
  let inTable = false;
  
  for (const line of lines) {
    if (line.includes('| Suite | Status |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|') && !line.includes('----')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 6) {
        const [name, status, passed, failed, skipped, total] = parts;
        
        if (!suites.has(name)) {
          suites.set(name, {
            name,
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
          });
        }
        
        const suite = suites.get(name);
        suite.passed += parseInt(passed) || 0;
        suite.failed += parseInt(failed) || 0;
        suite.skipped += parseInt(skipped) || 0;
        suite.total += parseInt(total) || 0;
      }
    }
    if (inTable && line === '') {
      inTable = false;
    }
  }
  
  return suites;
}

function getStatusIcon(passed, failed) {
  if (failed > 0) return '🔴';
  if (passed > 0) return '🟢';
  return '🟡';
}

function getStatusText(passed, failed) {
  if (failed > 0) return 'failed';
  if (passed > 0) return 'passed';
  return 'skipped';
}

function generateMergedSummary(allSuites) {
  const suites = Array.from(allSuites.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Calculate totals
  const totals = suites.reduce(
    (acc, suite) => ({
      passed: acc.passed + suite.passed,
      failed: acc.failed + suite.failed,
      skipped: acc.skipped + suite.skipped,
      total: acc.total + suite.total,
    }),
    { passed: 0, failed: 0, skipped: 0, total: 0 }
  );

  let markdown = '# 🧪 E2E Test Summary (All Shards)\n\n';
  
  // Overall status
  const overallIcon = getStatusIcon(totals.passed, totals.failed);
  const overallStatus = getStatusText(totals.passed, totals.failed).toUpperCase();
  markdown += `## Overall Status: ${overallIcon} ${overallStatus}\n\n`;
  
  // Summary stats
  markdown += '### 📊 Summary Statistics\n\n';
  markdown += `- **Total Tests**: ${totals.total}\n`;
  markdown += `- **✅ Passed**: ${totals.passed}\n`;
  markdown += `- **❌ Failed**: ${totals.failed}\n`;
  markdown += `- **⏭️ Skipped**: ${totals.skipped}\n`;
  
  if (totals.total > 0) {
    const passRate = ((totals.passed / totals.total) * 100).toFixed(1);
    markdown += `- **📈 Pass Rate**: ${passRate}%\n`;
  }
  
  markdown += '\n';

  // Test suites breakdown
  markdown += '### 📋 Test Suites\n\n';
  markdown += '| Suite | Status | Passed | Failed | Skipped | Total |\n';
  markdown += '|-------|--------|--------|--------|---------|-------|\n';

  for (const suite of suites) {
    const icon = getStatusIcon(suite.passed, suite.failed);
    const status = getStatusText(suite.passed, suite.failed);
    markdown += `| ${suite.name} | ${icon} ${status} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suite.total} |\n`;
  }

  markdown += '\n---\n';
  markdown += `*Generated from ${suites.length} test suites across multiple shards*\n`;

  return markdown;
}

async function main() {
  try {
    // Find all test summary files using native Node.js
    const summaryFiles = fs.readdirSync('.')
      .filter(file => file.startsWith('test-summary-') && file.endsWith('.md'));
    
    if (summaryFiles.length === 0) {
      console.log('No test summary files found');
      return;
    }
    
    console.log(`Found ${summaryFiles.length} test summary files`);
    
    const allSuites = new Map();
    
    // Parse each summary file
    for (const file of summaryFiles) {
      console.log(`Processing ${file}`);
      const content = fs.readFileSync(file, 'utf8');
      const suites = parseMarkdownTable(content);
      
      // Merge suites
      for (const [name, suite] of suites) {
        if (!allSuites.has(name)) {
          allSuites.set(name, { ...suite });
        } else {
          const existing = allSuites.get(name);
          existing.passed += suite.passed;
          existing.failed += suite.failed;
          existing.skipped += suite.skipped;
          existing.total += suite.total;
        }
      }
    }
    
    // Generate merged summary
    const mergedSummary = generateMergedSummary(allSuites);
    
    // Write to GitHub Actions summary if in CI
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, mergedSummary);
      console.log('✅ Test summary added to GitHub Actions job summary');
    }
    
    // Also write to file for artifact
    fs.writeFileSync('merged-test-summary.md', mergedSummary);
    console.log('✅ Merged test summary written to merged-test-summary.md');
    
    // Log test results summary (don't exit with error code for failed tests - that's handled elsewhere)
    const hasFailed = Array.from(allSuites.values()).some(suite => suite.failed > 0);
    if (hasFailed) {
      console.log('❌ Some tests failed - summary generated successfully');
    } else {
      console.log('✅ All tests passed - summary generated successfully');
    }
    
  } catch (error) {
    console.error('❌ Error generating test summary:', error);
    process.exit(1);
  }
}

main();
