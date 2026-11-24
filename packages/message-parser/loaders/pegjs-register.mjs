import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

import peggy from 'peggy';

registerHooks({
	load(url, context, nextLoad) {
		if (!url.endsWith('.pegjs')) {
			return nextLoad(url, context);
		}

		const parser = peggy.generate(readFileSync(fileURLToPath(url), 'utf-8'), {
			output: 'source',
			format: 'es',
		});
		const source = `import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\n${parser}`;

		return { format: 'module', source, shortCircuit: true };
	},
});
