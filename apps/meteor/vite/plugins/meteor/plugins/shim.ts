import { prefixRegex } from '@rolldown/pluginutils';
import { parse } from 'oxc-parser';
import type { Plugin } from 'vite';

import { analyze } from './shared/analyze';
import type { ResolvedPluginOptions } from './shared/config';

export function shim(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:shim',
		transform: {
			filter: {
				id: prefixRegex(resolvedConfig.programsDir),
			},
			async handler(code, id) {
				this.debug(id);
				const ast = await parse(id, code);

				const module = analyze(ast.program);

				const imports = Array.from(module.imports.keys()).map((imp) => {
					return `import '${resolvedConfig.prefix}${imp}';`;
				});

				if (imports.length > 0) {
					code = `${imports.join('\n')}\n${code}`;
				}

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
