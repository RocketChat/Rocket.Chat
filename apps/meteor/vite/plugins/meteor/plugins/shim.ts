import path from 'node:path';
import { inspect } from 'node:util';

import { prefixRegex } from '@rolldown/pluginutils';
import { parse } from 'oxc-parser';
import type { Plugin } from 'vite';

import { analyze } from './shared/analyze';
import type { ResolvedPluginOptions } from './shared/config';
import { printCode } from './shared/print';
import { treeshake } from './shared/treeshake';

export function shim(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:shim',
		transform: {
			filter: {
				id: prefixRegex(path.resolve(resolvedConfig.programsDir)),
			},
			async handler(code, id) {
				this.debug(id);
				const ast = await parse(id, code);

				if (path.basename(id) === 'modules.js') {
					console.log(`[Shim] processing modules.js ${code.length}`);
					treeshake(ast.program);
					code = printCode(ast.program);
					console.log(`[Shim] processed modules.js ${code.length}`);
				}

				const module = analyze(ast.program);

				const imports = Array.from(module.imports.keys()).map((imp) => {
					return `import '${resolvedConfig.prefix}${imp}';`;
				});

				if (imports.length > 0) {
					code = `${imports.join('\n')}\n${code}`;
				}

				this.debug(inspect(module, { colors: true }));

				code = code.replaceAll('global = this;', 'global = globalThis;');

				if (!module.name) {
					return code;
				}

				return `${code}
export const { ${Array.from(module.exports).join(', ')} } = Package['${module.name}'];`;
			},
		},
	};
}
