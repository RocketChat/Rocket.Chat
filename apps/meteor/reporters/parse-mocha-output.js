#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Parses Mocha spec reporter output to generate test summaries
 * This works by parsing the console output instead of requiring JSON reporter
 * Keeps the API test configuration completely unchanged
 */

function isTestLine(trimmed) {
	return trimmed.match(/^[✓×-]\s/) || trimmed.includes('passing') || trimmed.includes('failing') || trimmed.includes('pending');
}

function isSuiteHeader(trimmed) {
	return trimmed.length > 0 && !trimmed.includes('(') && !trimmed.includes('ms') && !trimmed.match(/^\d+\s/);
}

function updateSuiteForTest(suites, currentSuite, testType) {
	if (currentSuite && suites.has(currentSuite)) {
		const suite = suites.get(currentSuite);
		suite[testType]++;
		suite.total++;

		if (testType === 'failed') {
			suite.status = 'failed';
		} else if (testType === 'skipped' && suite.passed > 0) {
			suite.status = 'mixed';
		}
	}
}

function parseTestLines(lines, suites) {
	let currentSuite = null;
	let testCount = 0;

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip empty lines and non-test output
		if (!trimmed || trimmed.startsWith('npm') || trimmed.startsWith('>')) {
			continue;
		}

		// Detect suite headers
		if (!isTestLine(trimmed)) {
			if (isSuiteHeader(trimmed)) {
				currentSuite = trimmed;
				if (!suites.has(currentSuite)) {
					const filePath = `tests/end-to-end/api/${currentSuite.toLowerCase().replace(/\s+/g, '-')}.ts`;
					suites.set(currentSuite, {
						name: currentSuite,
						passed: 0,
						failed: 0,
						skipped: 0,
						total: 0,
						status: 'passed',
						filePath,
						lineNumber: null,
					});
				}
			}
			continue;
		}

		// Parse test results
		testCount++;
		if (trimmed.match(/^✓\s/)) {
			updateSuiteForTest(suites, currentSuite, 'passed');
		} else if (trimmed.match(/^×\s/) || trimmed.match(/^\d+\)\s/)) {
			updateSuiteForTest(suites, currentSuite, 'failed');
		} else if (trimmed.match(/^-\s/)) {
			updateSuiteForTest(suites, currentSuite, 'skipped');
		}
	}

	return testCount;
}

function createReport(suites, testCount) {
	// If we couldn't parse suites properly, create a generic one
	if (suites.size === 0 && testCount > 0) {
		suites.set('API Tests', {
			name: 'API Tests',
			passed: 0,
			failed: 0,
			skipped: 0,
			total: testCount,
			status: 'unknown',
			filePath: undefined,
			lineNumber: null,
		});
	}

	const summaries = Array.from(suites.values());
	summaries.sort((a, b) => a.name.localeCompare(b.name));

	// Calculate totals
	const totals = { passed: 0, failed: 0, skipped: 0, total: 0 };
	for (const summary of summaries) {
		totals.passed += summary.passed;
		totals.failed += summary.failed;
		totals.skipped += summary.skipped;
		totals.total += summary.total;
	}

	return {
		summaries,
		totals,
		metadata: {
			timestamp: new Date().toISOString(),
			shard: process.env.MOCHA_SHARD || '1',
			type: 'api',
			release: process.env.IS_EE === 'true' ? 'ee' : 'ce',
			note: 'Generated from spec output parsing',
		},
	};
}

function parseMochaSpecOutput(logContent, outputPath) {
	try {
		const lines = logContent.split('\n');
		const suites = new Map();

		const testCount = parseTestLines(lines, suites);
		const report = createReport(suites, testCount);

		// Ensure output directory exists
		const outputDir = path.dirname(outputPath);
		if (outputDir !== '.') {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		// Write summary file
		fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
		console.log(`✅ API Test summary parsed and written to ${outputPath}`);
		console.log(
			`📊 Parsed: ${report.totals.total} tests (${report.totals.passed} passed, ${report.totals.failed} failed, ${report.totals.skipped} skipped)`,
		);

		return true;
	} catch (error) {
		console.error('❌ Failed to parse Mocha output:', error);

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
					error: 'Failed to parse Mocha spec output',
				},
			};
			fs.writeFileSync(outputPath, JSON.stringify(emptyReport, null, 2), 'utf8');
			console.log(`⚠️ Empty API test summary written to ${outputPath} due to parsing error`);
		} catch (writeError) {
			console.error('❌ Failed to write empty summary:', writeError);
		}

		return false;
	}
}

// CLI usage
if (require.main === module) {
	const logFile = process.argv[2] || 'api-test-output.log';
	const outputPath = process.argv[3] || process.env.GITHUB_SUMMARY_PATH || 'test-summary-api.json';

	console.log(`Parsing Mocha spec output from ${logFile} to ${outputPath}`);

	if (fs.existsSync(logFile)) {
		const logContent = fs.readFileSync(logFile, 'utf8');
		parseMochaSpecOutput(logContent, outputPath);
	} else {
		console.error(`❌ Log file ${logFile} not found`);
		process.exit(1);
	}
}

module.exports = { parseMochaSpecOutput };
