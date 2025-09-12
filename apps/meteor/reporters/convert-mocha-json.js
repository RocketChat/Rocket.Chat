#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Converts Mocha JSON reporter output to our test summary format
 * This allows us to use the reliable built-in JSON reporter instead of a custom one
 */

function convertMochaJsonToSummary(mochaJsonPath, outputPath) {
	try {
		// Read Mocha JSON output
		const mochaData = JSON.parse(fs.readFileSync(mochaJsonPath, 'utf8'));

		// Group tests by suite
		const suiteMap = new Map();

		if (mochaData.tests && Array.isArray(mochaData.tests)) {
			for (const test of mochaData.tests) {
				const suiteName = test.fullTitle?.split(' ')[0] || test.title?.split(' ')[0] || 'Unknown Suite';
				const filePath = test.file;

				// Initialize or get existing suite
				let suite = suiteMap.get(suiteName);
				if (!suite) {
					suite = {
						name: suiteName,
						passed: 0,
						failed: 0,
						skipped: 0,
						total: 0,
						status: 'passed',
						filePath,
						lineNumber: null,
					};
					suiteMap.set(suiteName, suite);
				}

				// Update counters
				suite.total++;
				if (test.state === 'passed') {
					suite.passed++;
				} else if (test.state === 'failed') {
					suite.failed++;
				} else if (test.pending || test.state === 'pending') {
					suite.skipped++;
				}

				// Update suite status
				if (suite.failed > 0) {
					suite.status = 'failed';
				} else if (suite.passed > 0 && suite.skipped > 0) {
					suite.status = 'mixed';
				}
			}
		}

		const summaries = Array.from(suiteMap.values());

		// Sort by name for consistent output
		summaries.sort((a, b) => a.name.localeCompare(b.name));

		// Calculate totals
		const totals = { passed: 0, failed: 0, skipped: 0, total: 0 };
		for (const summary of summaries) {
			totals.passed += summary.passed;
			totals.failed += summary.failed;
			totals.skipped += summary.skipped;
			totals.total += summary.total;
		}

		// Create report in our expected format
		const report = {
			summaries,
			totals,
			metadata: {
				timestamp: new Date().toISOString(),
				shard: process.env.MOCHA_SHARD || '1',
				type: 'api',
				release: process.env.IS_EE === 'true' ? 'ee' : 'ce',
			},
		};

		// Ensure output directory exists
		const outputDir = path.dirname(outputPath);
		if (outputDir !== '.') {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		// Write summary file
		fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
		console.log(`✅ API Test summary converted and written to ${outputPath}`);

		return true;
	} catch (error) {
		console.error('❌ Failed to convert Mocha JSON to summary:', error);

		// Create empty summary on error
		try {
			const emptyReport = {
				summaries: [],
				totals: { passed: 0, failed: 0, skipped: 0, total: 0 },
				metadata: {
					timestamp: new Date().toISOString(),
					shard: process.env.MOCHA_SHARD || '1',
					type: 'api',
					release: process.env.IS_EE === 'true' ? 'ee' : 'ce',
					error: 'Failed to convert Mocha JSON output',
				},
			};
			fs.writeFileSync(outputPath, JSON.stringify(emptyReport, null, 2), 'utf8');
			console.log(`⚠️ Empty API test summary written to ${outputPath} due to conversion error`);
		} catch (writeError) {
			console.error('❌ Failed to write empty summary:', writeError);
		}

		return false;
	}
}

// CLI usage
if (require.main === module) {
	const mochaJsonPath = process.argv[2] || 'mocha-results.json';
	const outputPath = process.argv[3] || process.env.GITHUB_SUMMARY_PATH || 'test-summary-api.json';

	console.log(`Converting Mocha JSON from ${mochaJsonPath} to ${outputPath}`);
	convertMochaJsonToSummary(mochaJsonPath, outputPath);
}

module.exports = { convertMochaJsonToSummary };
