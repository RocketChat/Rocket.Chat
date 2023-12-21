import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

const dir = process.env.COVERAGE_DIR;
const reporter = process.env.COVERAGE_REPORTER || 'lcov';

console.log('Coverage plugin started');

if (!dir && !reporter) {
	console.log('Coverage plugin not configured');
} else if (!dir || !reporter) {
	console.log('Coverage plugin not fully configured');
} else {
	try {
		if (!dir) {
			throw new Error('No coverage dir');
		}

		if (!reporter) {
			throw new Error('No coverage reporter');
		}
		console.log('Coverage plugin triggered');
		// eslint-disable-next-line no-undef
		const coverageMap = libCoverage.createCoverageMap(globalThis.__coverage__);

		const configWatermarks = {
			statements: [50, 80],
			functions: [50, 80],
			branches: [50, 80],
			lines: [50, 80],
		};

		const context = libReport.createContext({
			dir,
			coverageMap,
			watermarks: configWatermarks,
		});

		const report = reports.create(reporter);

		report.execute(context);
	} catch (e) {
		console.log('Error', e);
	}
}
