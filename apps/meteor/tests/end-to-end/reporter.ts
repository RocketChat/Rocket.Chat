import Mocha from 'mocha';

import { getLastRequest } from './teardown';

const { EVENT_TEST_FAIL } = Mocha.Runner.constants;

module.exports = class FailDumpReporter extends Mocha.reporters.Spec {
	constructor(runner: Mocha.Runner, options: Mocha.MochaOptions) {
		super(runner, options);
		runner.on(EVENT_TEST_FAIL, (runnable) => {
			const { lastUrl, lastMethod, lastBody, lastQuery, lastResponse } = getLastRequest();
			console.log({
				where: runnable.fullTitle(),
				type: runnable.type,
				lastUrl,
				lastMethod,
				lastBody,
				lastQuery,
				lastResponse: lastResponse?.text,
			});
		});
	}
};
