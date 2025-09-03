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
    // Find all test summary files using native Node.js (check current dir and subdirs)
    let summaryFiles = [];
    
    // Function to find files recursively
    function findSummaryFiles(dir = '.') {
      const files = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isFile()) {
            // Match various test summary file patterns
            if ((entry.name.includes('test-summary') || entry.name.startsWith('test-summary-')) && 
                entry.name.endsWith('.md')) {
              files.push(fullPath);
            }
          } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            // Recursively search subdirectories (but skip hidden dirs and node_modules)
            files.push(...findSummaryFiles(fullPath));
          }
        }
      } catch (error) {
        console.log(`Could not read directory ${dir}:`, error.message);
      }
      return files;
    }
    
    summaryFiles = findSummaryFiles();
    
    if (summaryFiles.length === 0) {
      console.log('❌ No test summary files found');
      console.log('Expected patterns: test-summary*.md or *test-summary*.md');
      
      // List all .md files for debugging
      try {
        const allMdFiles = fs.readdirSync('.').filter(f => f.endsWith('.md'));
        if (allMdFiles.length > 0) {
          console.log('📄 Found .md files in current directory:');
          allMdFiles.forEach(file => console.log(`  - ${file}`));
        }
      } catch (error) {
        console.log('Could not list .md files for debugging:', error.message);
      }
      
      // Create empty summary to avoid CI failure
      const emptySummary = generateMergedSummary(new Map());
      fs.writeFileSync('merged-test-summary.md', emptySummary);
      console.log('✅ Created empty merged test summary');
      return;
    }
    
    console.log(`📊 Found ${summaryFiles.length} test summary files:`);
    summaryFiles.forEach(file => console.log(`  - ${file}`));
    
    const allSuites = new Map();
    let filesProcessed = 0;
    
    // Parse each summary file
    for (const file of summaryFiles) {
      try {
        console.log(`🔍 Processing ${file}`);
        const content = fs.readFileSync(file, 'utf8');
        const suites = parseMarkdownTable(content);
        
        if (suites.size === 0) {
          console.log(`  ⚠️ No test suites found in ${file}`);
        } else {
          console.log(`  ✅ Found ${suites.size} test suites in ${file}`);
        }
        
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
        
        filesProcessed++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        // Continue processing other files
      }
    }
    
    console.log(`📈 Summary: Processed ${filesProcessed}/${summaryFiles.length} files, found ${allSuites.size} unique test suites`);
    
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
    const totals = Array.from(allSuites.values()).reduce(
      (acc, suite) => ({
        passed: acc.passed + suite.passed,
        failed: acc.failed + suite.failed,
        skipped: acc.skipped + suite.skipped,
        total: acc.total + suite.total,
      }),
      { passed: 0, failed: 0, skipped: 0, total: 0 }
    );
    
    console.log(`📊 Final totals: ${totals.total} tests (✅${totals.passed} passed, ❌${totals.failed} failed, ⏭️${totals.skipped} skipped)`);
    
    if (totals.failed > 0) {
      console.log('❌ Some tests failed - summary generated successfully');
    } else if (totals.total > 0) {
      console.log('✅ All tests passed - summary generated successfully');
    } else {
      console.log('ℹ️ No tests found - empty summary generated');
    }
    
  } catch (error) {
    console.error('❌ Error generating test summary:', error);
    process.exit(1);
  }
}

main();
