import path from 'node:path';
import { inspect } from 'node:util';

import { prefixRegex } from '@rolldown/pluginutils';
import { parse } from 'oxc-parser';
import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';
import { collectModuleExports } from './shared/visit-export';

export function shim(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:shim',
		enforce: 'pre',
		transform: {
			filter: {
				id: prefixRegex(path.resolve(resolvedConfig.programsDir)),
			},
			async handler(code, id) {
				this.info(`Shimming Meteor package: ${id}`);
				const ast = await parse(id, code);
				const module = collectModuleExports(ast.program);

				const imports = Array.from(module.imports.keys())
					.map((imp) => {
						return `import '${resolvedConfig.prefix}${imp}';`;
					})
					.join('\n');

				if (imports.length > 0) {
					code = `${imports}\n${code}`;
				}

				this.info(inspect(module, { colors: true }));

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
