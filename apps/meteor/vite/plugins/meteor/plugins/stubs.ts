import path from 'node:path';

import { prefixRegex } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config.ts';

export function stubs(config: ResolvedPluginOptions): Plugin {
	const meteorPackagesDir = path.join(config.programsDir, 'web.browser', 'packages');

	return {
		name: 'meteor:stubs',
		enforce: 'post',
		transform: {
			filter: {
				// Only transform files in the Meteor packages
				// Starting from .meteor/local/build/programs/web.browser/packages/
				id: prefixRegex(meteorPackagesDir),
			},
			handler(code, id, options) {
				if (options?.ssr) {
					return null;
				}

				const basename = path.basename(id);

				if (basename === 'modules.js') {
					// Remove `install("<name>")` and `install("<name>", "<mainModule>")` calls for packages being replaced
					for (const moduleName of Object.keys(config.modules)) {
						const installRegex = new RegExp(`install\\(\\s*['"]${moduleName}['"](?:\\s*,\\s*['"][^'"]+['"])?\\s*\\);?`, 'g');
						code = code.replace(installRegex, (_match) => {
							return '';
						});
					}
				}

				// Replace modules according to the provided mapping
				for (const [moduleName, replacement] of Object.entries(config.modules)) {
					// Replace `var X = Package.moduleName.X;` with `var X = replacement;`
					// Replace `var Y = Package['moduleName'].Y;` with `var Y = replacement;`
					// If replacement is null, replace with `undefined`
					const packageAccessRegex = new RegExp(
						`var\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*Package(?:\\.|\\[')${moduleName}(?:'\\])?\\.\\s*([A-Za-z_$][\\w$]*);`,
						'g',
					);
					code = code.replace(packageAccessRegex, (_match, varName, exportName) => {
						const replacementValue = replacement === null ? 'undefined' : replacement;
						if (exportName === varName) {
							return `var ${varName} = ${replacementValue};`;
						}
						return `var ${varName} = ${replacementValue}.${exportName};`;
					});

					const requireRegex = new RegExp(`require\\(\\s*['"]meteor/${moduleName}['"]\\s*\\)`, 'g');
					code = code.replace(requireRegex, (_match) => {
						const replacementValue = replacement === null ? 'undefined' : replacement;
						return replacementValue;
					});
				}

				if (this.environment.mode === 'build') {
					this.emitFile({
						type: 'prebuilt-chunk',
						fileName: basename,
						code,
					});
				}

				return { code, map: null };
			},
		},
	};
}
