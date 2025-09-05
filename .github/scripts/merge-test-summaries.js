#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Merges multiple test summary JSON files into a single comprehensive markdown summary
 * and outputs it as a GitHub Actions job summary
 */

/**
 * Parses a JSON test summary report and extracts test suites data
 * @param {string} content - Raw JSON content from test summary file
 * @returns {{suites: Map<string, Object>, metadata: Object}} Parsed test suites and metadata
 */
function parseJsonReport(content) {
  try {
    const report = JSON.parse(content);
    const suites = new Map();
    
    if (report.summaries) {
      for (const summary of report.summaries) {
        suites.set(summary.name, {
          name: summary.name,
          passed: summary.passed,
          failed: summary.failed,
          skipped: summary.skipped,
          total: summary.total,
          filePath: summary.filePath,
          lineNumber: summary.lineNumber
        });
      }
    }
    
    return { suites, metadata: report.metadata || {} };
  } catch (error) {
    console.error('Failed to parse JSON:', error.message);
    return { suites: new Map(), metadata: {} };
  }
}


/**
 * Returns the appropriate status icon based on test results
 * @param {number} passed - Number of passed tests
 * @param {number} failed - Number of failed tests
 * @returns {string} Status icon emoji
 */
function getStatusIcon(passed, failed) {
  if (failed > 0) return '🔴';
  if (passed > 0) return '🟢';
  return '🟡';
}

/**
 * Returns the appropriate status text based on test results
 * @param {number} passed - Number of passed tests
 * @param {number} failed - Number of failed tests
 * @returns {string} Status text ('failed', 'passed', or 'skipped')
 */
function getStatusText(passed, failed) {
  if (failed > 0) return 'failed';
  if (passed > 0) return 'passed';
  return 'skipped';
}

/**
 * Generates a GitHub link to the test file and line number
 * @param {string} suiteName - Name of the test suite
 * @param {string} filePath - Path to the test file
 * @param {number} lineNumber - Line number in the file
 * @returns {string} Formatted suite name with GitHub link
 */
function formatSuiteNameWithLink(suiteName, filePath, lineNumber) {
  // If we don't have file path info, return the suite name as-is
  if (!filePath) {
    return suiteName;
  }
  
  // Extract repository info from environment variables or use defaults
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || 'RocketChat';
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'Rocket.Chat';
  const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || 'develop';
  
  // Convert absolute path to relative path by removing common prefixes
  let relativePath = filePath;
  const commonPrefixes = ['/home/runner/work/Rocket.Chat/Rocket.Chat/', '/github/workspace/', process.cwd() + '/'];
  for (const prefix of commonPrefixes) {
    if (relativePath.startsWith(prefix)) {
      relativePath = relativePath.substring(prefix.length);
      break;
    }
  }
  
  // Generate GitHub link
  const githubUrl = `https://github.com/${repoOwner}/${repoName}/blob/${branch}/${relativePath}`;
  const linkWithLine = lineNumber ? `${githubUrl}#L${lineNumber}` : githubUrl;
  
  return `[${suiteName}](${linkWithLine})`;
}

/**
 * Generates a comprehensive markdown summary from merged test suites and metadata
 * @param {Map<string, Object>} allSuites - Map of test suite names to their aggregated results
 * @param {Array<Object>} allMetadata - Array of metadata objects from all test runs
 * @param {boolean} includeLinks - Whether to include GitHub links in suite names
 * @returns {string} Formatted markdown summary
 */
function generateMergedSummary(allSuites, allMetadata, includeLinks = false) {
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

  // Test run metadata
  if (allMetadata.length > 0) {
    const uniqueShards = [...new Set(allMetadata.map(m => m.shard).filter(Boolean))];
    const uniqueTypes = [...new Set(allMetadata.map(m => m.type).filter(Boolean))];
    const uniqueReleases = [...new Set(allMetadata.map(m => m.release).filter(Boolean))];
    
    markdown += '### 📋 Test Run Info\n\n';
    if (uniqueShards.length > 0) {
      markdown += `- **Shards**: ${uniqueShards.join(', ')}\n`;
    }
    if (uniqueTypes.length > 0) {
      markdown += `- **Test Types**: ${uniqueTypes.join(', ')}\n`;
    }
    if (uniqueReleases.length > 0) {
      markdown += `- **Releases**: ${uniqueReleases.join(', ')}\n`;
    }
    markdown += '\n';
  }

  // Test suites breakdown
  markdown += '### 📋 Test Suites\n\n';
  
  if (includeLinks) {
    // GitHub Actions summary version with links, no padding
    markdown += `| Suite | Status | Passed | Failed | Skipped | Total |\n`;
    markdown += `|-------|--------|--------|--------|---------|-------|\n`;

    for (const suite of suites) {
      const icon = getStatusIcon(suite.passed, suite.failed);
      const status = getStatusText(suite.passed, suite.failed);
      const statusText = `${icon} ${status}`;
      const formattedName = formatSuiteNameWithLink(suite.name, suite.filePath, suite.lineNumber);
      
      markdown += `| ${formattedName} | ${statusText} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suite.total} |\n`;
    }
  } else {
    // Console/file version with padding, no links
    // Calculate column widths for better formatting
    const maxSuiteNameLength = Math.max('Suite'.length, ...suites.map(s => s.name.length));
    const maxStatusLength = Math.max('Status'.length, ...suites.map(s => {
      const status = getStatusText(s.passed, s.failed);
      return (status + ' ' + getStatusIcon(s.passed, s.failed)).length;
    }));
    
    // Create properly padded table headers
    const suiteHeader = 'Suite'.padEnd(maxSuiteNameLength);
    const statusHeader = 'Status'.padEnd(maxStatusLength);
    
    markdown += `| ${suiteHeader} | ${statusHeader} | Passed | Failed | Skipped | Total |\n`;
    markdown += `|${'-'.repeat(maxSuiteNameLength + 2)}|${'-'.repeat(maxStatusLength + 2)}|--------|--------|---------|-------|\n`;

    for (const suite of suites) {
      const icon = getStatusIcon(suite.passed, suite.failed);
      const status = getStatusText(suite.passed, suite.failed);
      const suiteName = suite.name.padEnd(maxSuiteNameLength);
      const statusText = `${icon} ${status}`.padEnd(maxStatusLength);
      const passed = suite.passed.toString().padStart(6);
      const failed = suite.failed.toString().padStart(6);
      const skipped = suite.skipped.toString().padStart(7);
      const total = suite.total.toString().padStart(5);
      
      markdown += `| ${suiteName} | ${statusText} | ${passed} | ${failed} | ${skipped} | ${total} |\n`;
    }
  }

  markdown += '\n---\n';
  markdown += `*Generated from ${suites.length} test suites across multiple shards*\n`;

  return markdown;
}

/**
 * Main function that orchestrates the test summary merging process
 * - Discovers test summary JSON files in current directory and subdirectories
 * - Parses and merges test results from multiple files
 * - Generates comprehensive markdown summary
 * - Outputs to GitHub Actions job summary and merged-test-summary.md file
 */
async function main() {
  try {
    // Find all test summary files using native Node.js (check current dir and subdirs)
    let summaryFiles = [];
    
    /**
     * Recursively finds test summary JSON files in directory tree
     * @param {string} dir - Directory to search (defaults to current directory)
     * @returns {Array<string>} Array of file paths to test summary JSON files
     */
    function findSummaryFiles(dir = '.') {
      const files = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isFile()) {
            // Match various test summary file patterns (JSON files only)
            if ((entry.name.includes('test-summary') || entry.name.startsWith('test-summary-')) && 
                entry.name.endsWith('.json')) {
              files.push(fullPath);
            }
          } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            // Check if this is an artifact directory with test-summary.json inside
            if (entry.name.startsWith('test-summary-')) {
              const jsonSummaryFile = path.join(fullPath, 'test-summary.json');
              try {
                if (fs.existsSync(jsonSummaryFile)) {
                  files.push(jsonSummaryFile);
                }
              } catch (error) {
                console.log(`Could not check for test-summary.json in ${fullPath}:`, error.message);
              }
            }
            // Also recursively search subdirectories for backwards compatibility
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
      console.log('Expected patterns: test-summary*.json');
      
      // List all potential files for debugging
      try {
        const allFiles = fs.readdirSync('.').filter(f => f.endsWith('.json'));
        if (allFiles.length > 0) {
          console.log('📄 Found .json files in current directory:');
          allFiles.forEach(file => console.log(`  - ${file}`));
        }
      } catch (error) {
        console.log('Could not list files for debugging:', error.message);
      }
      
      // Create empty summary to avoid CI failure
      const emptySummary = generateMergedSummary(new Map(), [], false);
      fs.writeFileSync('merged-test-summary.md', emptySummary);
      console.log('✅ Created empty merged test summary');
      return;
    }
    
    console.log(`📊 Found ${summaryFiles.length} test summary files:`);
    summaryFiles.forEach(file => console.log(`  - ${file}`));
    
    const allSuites = new Map();
    const allMetadata = [];
    let filesProcessed = 0;
    
    // Parse each summary file
    for (const file of summaryFiles) {
      try {
        console.log(`🔍 Processing ${file}`);
        const content = fs.readFileSync(file, 'utf8');
        
        let suites, metadata;
        if (file.endsWith('.json')) {
          const result = parseJsonReport(content);
          suites = result.suites;
          metadata = result.metadata;
          if (metadata) {
            allMetadata.push(metadata);
          }
        } else {
          console.log(`  ⚠️ Unsupported file format: ${file} (only JSON files supported)`);
          continue;
        }
        
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
            // Keep the first occurrence's file path and line number
            if (!existing.filePath && suite.filePath) {
              existing.filePath = suite.filePath;
              existing.lineNumber = suite.lineNumber;
            }
          }
        }
        
        filesProcessed++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        // Continue processing other files
      }
    }
    
    console.log(`📈 Summary: Processed ${filesProcessed}/${summaryFiles.length} files, found ${allSuites.size} unique test suites`);
    
    // Generate both versions of the summary
    const printedSummary = generateMergedSummary(allSuites, allMetadata, false); // No links, with padding
    const githubSummary = generateMergedSummary(allSuites, allMetadata, true);   // With links, no padding
    
    // Write to GitHub Actions summary if in CI (with links)
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, githubSummary);
      console.log('✅ Test summary with links added to GitHub Actions job summary');
    } else {
      console.log('ℹ️ No GitHub Actions summary file found - skipping links, content:' + githubSummary);
    }
    
    // Write to file for artifact (printed version without links)
    fs.writeFileSync('merged-test-summary.md', printedSummary);
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
