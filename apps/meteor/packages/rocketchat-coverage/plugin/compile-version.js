import { exec } from 'child_process';
import os from 'os';
import util from 'util';

import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import libCoverage from 'istanbul-lib-coverage';
import { WebApp } from 'meteor/webapp';

// Tells e2e runs which server files ran since the previous call, so CI can select specs by the server code they run
if (['true', 'api'].includes(process.env.TEST_MODE)) {
	const lastTotals = new Map();

	WebApp.connectHandlers.use('/__coverage__/functions', (_req, res) => {
		const ran = [];
		for (const [file, { f = {} }] of Object.entries(globalThis.__coverage__ ?? {})) {
			const total = Object.values(f).reduce((sum, count) => sum + count, 0);
			if (total > (lastTotals.get(file) ?? 0)) {
				ran.push(file);
			}
			lastTotals.set(file, total);
		}
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(ran));
	});
}

const dir = process.env.COVERAGE_DIR;
const fileName = process.env.COVERAGE_FILE_NAME;
const reporter = process.env.COVERAGE_REPORTER || 'lcov';

console.log('Coverage plugin started');

if (!dir && !reporter) {
	return console.log('Coverage plugin not configured');
}

if (!dir || !reporter) {
	console.log('Coverage plugin not fully configured');
	return;
}

process.on('exit', async () => {
	try {
		if (!dir) {
			throw new Error('No coverage dir');
		}

		if (!reporter) {
			throw new Error('No coverage reporter');
		}
		console.log('Coverage plugin triggered');

		const coverageMap = libCoverage.createCoverageMap(globalThis['__coverage__']);

		const configWatermarks = {
			statements: [50, 80],
			functions: [50, 80],
			branches: [50, 80],
			lines: [50, 80],
		};

		const context = libReport.createContext({
			dir,
			coverageMap,
		});

		console.log('Generating coverage report', { dir, reporter, fileName });
		const report = reports.create(reporter, { file: fileName });

		report.execute(context);
	} catch (e) {
		console.log('Error', e);
	}
});
