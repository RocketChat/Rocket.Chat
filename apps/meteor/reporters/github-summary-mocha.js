#!/usr/bin/env node

const { writeFileSync, mkdirSync } = require('fs');
const { dirname } = require('path');

/**
 * GitHub Summary Reporter for Mocha
 * Generates JSON test summaries compatible with the GitHub Actions workflow
 * Similar to the Playwright GitHub Summary Reporter
 */
class GitHubSummaryMochaReporter {
	constructor(runner, options) {
		this.runner = runner;
		this.testResults = new Map();
		this.outputPath =
			process.env.GITHUB_SUMMARY_PATH || (options.reporterOptions && options.reporterOptions.output) || 'test-summary-mocha.json';

		// Bind event handlers
		this.runner.on('test end', this.onTestEnd.bind(this));
		this.runner.on('end', this.onEnd.bind(this));
	}

	onTestEnd(test) {
		// Get the describe block name (suite title) and location info
		const { suiteName, filePath } = this.getSuiteNameAndLocation(test);

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
				lineNumber: null, // Mocha doesn't provide line numbers easily
			};
			this.testResults.set(suiteName, summary);
		}

		// Update counters based on test result
		summary.total++;
		switch (test.state) {
			case 'passed':
				summary.passed++;
				break;
			case 'failed':
				summary.failed++;
				break;
			case 'pending':
				summary.skipped++;
				break;
			default:
				// Handle other states (like undefined for skipped tests)
				if (test.pending) {
					summary.skipped++;
				} else {
					summary.failed++;
				}
				break;
		}

		// Update suite status
		if (summary.failed > 0) {
			summary.status = 'failed';
		} else if (summary.passed > 0 && summary.skipped > 0) {
			summary.status = 'mixed';
		}
	}

	onEnd() {
		this.generateSummaryJson();
	}

	getSuiteNameAndLocation(test) {
		// Walk up the suite hierarchy to collect all suite titles
		const suiteTitles = [];
		let suite = test.parent;

		while (suite) {
			if (suite.title && suite.title !== '') {
				suiteTitles.push(suite.title);
			}
			suite = suite.parent;
		}

		// Get file path from the test
		const filePath = test.file;

		// Return the top-most (outermost) describe block name
		// The array is built from innermost to outermost, so we want the last element
		const suiteName = suiteTitles.length > 0 ? suiteTitles[suiteTitles.length - 1] : 'Unknown';

		return {
			suiteName,
			filePath,
		};
	}

	generateSummaryJson() {
		const summaries = Array.from(this.testResults.values());

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

		// Create report object
		const report = {
			summaries,
			totals,
			metadata: {
				timestamp: new Date().toISOString(),
				shard: process.env.MOCHA_SHARD || process.env.PLAYWRIGHT_SHARD || '1',
				type: process.env.TEST_TYPE || 'api',
				release: process.env.IS_EE === 'true' ? 'ee' : 'ce',
				reporter: 'github-summary-mocha',
			},
		};

		// Write to file
		try {
			// Ensure directory exists
			const dir = dirname(this.outputPath);
			if (dir !== '.') {
				mkdirSync(dir, { recursive: true });
			}

			writeFileSync(this.outputPath, JSON.stringify(report, null, 2), 'utf8');
			console.log(`✅ Mocha test summary written to ${this.outputPath}`);
			console.log(
				`📊 Summary: ${report.totals.total} tests (${report.totals.passed} passed, ${report.totals.failed} failed, ${report.totals.skipped} skipped)`,
			);
		} catch (error) {
			console.error('❌ Failed to write Mocha test summary:', error);
		}
	}
}

module.exports = GitHubSummaryMochaReporter;
