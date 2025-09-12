const fs = require('fs');
const path = require('path');

/**
 * Mocha reporter that generates GitHub-compatible test summaries in JSON format
 * Compatible with the existing merge-test-summaries.js script
 */
class MochaGitHubSummaryReporter {
	constructor(runner, options) {
		this.runner = runner;
		this.options = options || {};
		this.outputPath = this.options.reporterOptions?.outputPath || 'test-summary.json';
		this.testResults = new Map();

		// Set up event listeners
		this.runner.on('test end', (test) => this.onTestEnd(test));
		this.runner.on('end', () => this.onEnd());
	}

	onTestEnd(test) {
		// Get the describe block name (suite title) and location info
		const { suiteName, filePath, lineNumber } = this.getSuiteNameAndLocation(test);

		// Initialize or get existing summary
		let summary = this.testResults.get(suiteName);
		if (!summary) {
			summary = {
				name: suiteName,
				passed: 0,
				failed: 0,
				skipped: 0,
				total: 0,
				status: 'passed',
				filePath,
				lineNumber,
			};
			this.testResults.set(suiteName, summary);
		}

		// Update counters based on test result
		summary.total++;
		if (test.state === 'passed') {
			summary.passed++;
		} else if (test.state === 'failed') {
			summary.failed++;
		} else if (test.pending || test.state === 'pending') {
			summary.skipped++;
		}

		// Update suite status
		if (summary.failed > 0) {
			summary.status = 'failed';
		} else if (summary.passed > 0 && summary.skipped > 0) {
			summary.status = 'mixed';
		}
	}

	getSuiteNameAndLocation(test) {
		// Get the top-level describe block (suite) name
		let suite = test.parent;
		let suiteName = test.parent.title;

		// Walk up to find the root suite
		while (suite.parent && suite.parent.title) {
			suite = suite.parent;
			if (suite.title) {
				suiteName = suite.title;
			}
		}

		// Get file path from the test
		const filePath = test.file;
		let lineNumber = null;

		// Try to extract line number if available
		if (test.body && typeof test.body === 'string') {
			// This is a rough approximation - Mocha doesn't provide exact line numbers
			// We could enhance this later if needed
			lineNumber = null;
		}

		return {
			suiteName: suiteName || 'Unknown Suite',
			filePath,
			lineNumber,
		};
	}

	onEnd() {
		this.generateSummaryJson();
	}

	generateSummaryJson() {
		const summaries = Array.from(this.testResults.values());

		// Sort by name for consistent output
		summaries.sort((a, b) => a.name.localeCompare(b.name));

		// Calculate totals
		const totals = summaries.reduce(
			(acc, summary) => ({
				passed: acc.passed + summary.passed,
				failed: acc.failed + summary.failed,
				skipped: acc.skipped + summary.skipped,
				total: acc.total + summary.total,
			}),
			{ passed: 0, failed: 0, skipped: 0, total: 0 },
		);

		// Create report object matching the format from Playwright reporter
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

		// Write to file
		try {
			// Ensure directory exists
			const dir = path.dirname(this.outputPath);
			if (dir !== '.') {
				fs.mkdirSync(dir, { recursive: true });
			}

			fs.writeFileSync(this.outputPath, JSON.stringify(report, null, 2), 'utf8');
			console.log(`✅ API Test summary written to ${this.outputPath}`);
		} catch (error) {
			console.error('❌ Failed to write API test summary:', error);
		}
	}
}

module.exports = MochaGitHubSummaryReporter;
