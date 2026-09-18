import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Stryker, StrykerCli } from '@stryker-mutator/core';

const config = fileURLToPath(new URL('../stryker.config.mjs', import.meta.url));
new StrykerCli([process.execPath, 'stryker', 'run', config, ...process.argv.slice(2)], undefined, async (options) => {
	try {
		// Keep JSON and target validation even when console reporters are customized.
		if (options.reporters) options.reporters = [...new Set([...options.reporters, 'json', 'mutation-targets'])];
		options.jsonReporter = { fileName: resolve('reports/mutation/mutation.json') };
		options.inPlace = false;
		await new Stryker(options).runMutationTest();
		process.send?.({ completion: options.dryRunOnly ? 'dry-run' : 'complete', targets: options.mutate ?? null });
	} catch (error) {
		process.send?.({ completion: 'failed', error: error.message });
		process.exitCode = 3;
	} finally {
		process.disconnect?.();
	}
}).run();
