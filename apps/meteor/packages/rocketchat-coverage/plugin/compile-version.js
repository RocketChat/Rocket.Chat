import { exec } from 'child_process';
import os from 'os';
import util from 'util';

import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import libCoverage from 'istanbul-lib-coverage';

const dir = process.env.COVERAGE_DIR;
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

		const report = reports.create(reporter);

		report.execute(context);
	} catch (e) {
		console.log('Error', e);
	}
});
