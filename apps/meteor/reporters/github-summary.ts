import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

import type { Reporter, TestCase, TestResult, Suite } from '@playwright/test/reporter';

interface ITestSummary {
	name: string;
	passed: number;
	failed: number;
	skipped: number;
	total: number;
	status: 'passed' | 'failed' | 'mixed';
	filePath?: string;
	lineNumber?: number;
}

interface ITestSummaryReport {
	summaries: ITestSummary[];
	totals: {
		passed: number;
		failed: number;
		skipped: number;
		total: number;
	};
	metadata: {
		timestamp: string;
		shard?: string;
		type?: string;
		release?: string;
	};
}

class GitHubSummaryReporter implements Reporter {
	private testResults: Map<string, ITestSummary> = new Map();

	private outputPath: string;

	constructor(options: { outputPath?: string } = {}) {
		this.outputPath = options.outputPath || 'test-summary.json';
	}

	onTestEnd(test: TestCase, result: TestResult) {
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
		// Only count the final attempt to avoid double-counting retries
		const isLastAttempt = typeof result.retry === 'number' ? result.retry === test.results.length - 1 : true;
		if (!isLastAttempt) {
			return;
		}
		summary.total++;
		switch (result.status) {
			case 'passed':
				summary.passed++;
				break;
			case 'failed':
				summary.failed++;
				break;
			case 'skipped':
				summary.skipped++;
				break;
			case 'timedOut':
			case 'interrupted':
				summary.failed++;
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

	private getSuiteNameAndLocation(test: TestCase): { suiteName: string; filePath?: string; lineNumber?: number } {
		// Walk up the suite hierarchy to collect all suite titles
		const suiteTitles: string[] = [];
		let suite: Suite | undefined = test.parent;
		let topLevelSuite: Suite | undefined;

		while (suite) {
			if (suite.title && suite.title !== '') {
				// Skip filenames (they typically end with .spec.ts or .spec.js)
				if (!suite.title.endsWith('.spec.ts') && !suite.title.endsWith('.spec.js')) {
					suiteTitles.push(suite.title);
					// Keep track of the outermost describe block
					topLevelSuite = suite;
				}
			}
			suite = suite.parent;
		}

		// Get file path and line number from the test case
		const filePath = test.location?.file;
		// Try to get line number from the top-level suite if available, otherwise from the test
		const lineNumber = topLevelSuite?.location?.line || test.location?.line;

		// Return the top-most (outermost) describe block name
		// The array is built from innermost to outermost, so we want the last element
		const suiteName = suiteTitles.length > 0 ? suiteTitles[suiteTitles.length - 1] : 'Unknown';

		return {
			suiteName,
			filePath,
			lineNumber,
		};
	}

	private generateSummaryJson() {
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
		const report: ITestSummaryReport = {
			summaries,
			totals,
			metadata: {
				timestamp: new Date().toISOString(),
				shard: process.env.PLAYWRIGHT_SHARD,
				type: process.env.TEST_TYPE,
				release: process.env.TEST_RELEASE,
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
			console.log(`✅ Test summary written to ${this.outputPath}`);
		} catch (error) {
			console.error('❌ Failed to write test summary:', error);
		}
	}
}

export default GitHubSummaryReporter;
