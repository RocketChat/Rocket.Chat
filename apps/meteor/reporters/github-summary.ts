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
		// Get the describe block name (suite title)
		const suiteName = this.getSuiteName(test);

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
			};
			this.testResults.set(suiteName, summary);
		}

		// Update counters based on test result
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

	private getSuiteName(test: TestCase): string {
		// Walk up the suite hierarchy to collect all suite titles
		const suiteTitles: string[] = [];
		let suite: Suite | undefined = test.parent;

		while (suite) {
			if (suite.title && suite.title !== '') {
				// Skip filenames (they typically end with .spec.ts or .spec.js)
				if (!suite.title.endsWith('.spec.ts') && !suite.title.endsWith('.spec.js')) {
					suiteTitles.push(suite.title);
				}
			}
			suite = suite.parent;
		}

		// Return the top-most (outermost) describe block name
		// The array is built from innermost to outermost, so we want the last element
		if (suiteTitles.length > 0) {
			return suiteTitles[suiteTitles.length - 1];
		}

		return 'Unknown';
	}

	private generateSummaryJson() {
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
