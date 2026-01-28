import fs from 'node:fs/promises';
import type { LoadHook } from 'node:module';
import { fileURLToPath } from 'node:url';

import { parse, Visitor } from 'oxc-parser';
import { transform } from 'oxc-transform';

import { loadInfo, loadSupportedVersionsInfo } from '../../vite-plugins/lib/info.ts';

const info = await loadInfo();
const supportedVersionsInfo = await loadSupportedVersionsInfo();

export const load: LoadHook = async function load(url, context, nextLoad) {
	if (url.endsWith('rocketchat.info')) {
		return {
			format: 'module',
			source: info,
			shortCircuit: true,
		};
	}
	if (url.endsWith('rocketchat-supported-versions.info')) {
		return {
			format: 'module',
			source: supportedVersionsInfo,
			shortCircuit: true,
		};
	}

	if (context.format?.startsWith('meteor/')) {
		const [, pkg] = context.format.split('/');
		const pkgName = pkg.replace(/:/g, '_');
		if (!pkgName) {
			throw new Error(`Invalid Meteor package format: ${context.format}`);
		}
		console.log(`Loading Meteor package: ${pkgName}`);
		const sourceText = await fs.readFile(`./.meteor/local/build/programs/server/packages/${pkgName}.js`, 'utf-8');
		const { code, map } = await transform(`${pkgName}.js`, sourceText, {
			sourcemap: true,
		});

		const source = `${code}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`;
		return {
			format: 'module',
			source,
			shortCircuit: true,
		};
	}

	if (/\.(js|.cjs|ts|tsx|jsx)$/.test(url)) {
		const filePath = fileURLToPath(url);
		const sourceText = await fs.readFile(filePath, 'utf8');

		// Check if this is a CommonJS file that needs conversion
		let transformedSource = sourceText;
		
		// For .cjs files or files in node_modules that use CommonJS, apply conversion
		if (url.endsWith('.cjs') || url.includes('node_modules')) {
			transformedSource = await cjsToEsm(filePath, sourceText);
		}

		// Transpile using oxc-transform
		const { code, map } = await transform(filePath, transformedSource, {
			sourcemap: true,
			sourceType: 'module'
		});

		const source = `${code}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(JSON.stringify(map)).toString('base64')}`;

		return {
			format: 'module',
			shortCircuit: true,
			source,
		};
	}

	// Default load for.js,.mjs,.json
	return nextLoad(url, context);
};

async function cjsToEsm(filename: string, source: string): Promise<string> {
	// Parse the source code using oxc-parser
	const parseResult = await parse(filename, source, { sourceType: 'module' });
	
	if (parseResult.errors && parseResult.errors.length > 0) {
		// If parsing as module fails, try as script (CommonJS)
		const scriptResult = await parse(filename, source, { sourceType: 'script' });
		if (scriptResult.errors && scriptResult.errors.length > 0) {
			return source; // Can't parse, return original
		}
	}

	// Check if the code uses CommonJS patterns (module.exports, exports)
	let hasModuleExports = false;
	let hasExports = false;
	let hasRequire = false;

	const visitor = new Visitor({
		MemberExpression(node) {
			const obj = node.object;
			const prop = node.property;
			
			if (obj.type === 'Identifier' && obj.name === 'module' && 
			    prop.type === 'Identifier' && prop.name === 'exports') {
				hasModuleExports = true;
			}
			if (obj.type === 'Identifier' && obj.name === 'exports') {
				hasExports = true;
			}
		},
		CallExpression(node) {
			if (node.callee.type === 'Identifier' && node.callee.name === 'require') {
				hasRequire = true;
			}
		}
	});

	visitor.visit(parseResult.program);

	// If it's a CommonJS module, wrap it
	if (hasModuleExports || hasExports || hasRequire) {
		return `
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const module = { exports: {} };
const exports = module.exports;

${source}

export default module.exports;
export const __esModule = true;

// Export named exports if they exist
if (typeof module.exports === 'object' && module.exports !== null) {
	for (const key of Object.keys(module.exports)) {
		if (key !== 'default') {
			try {
				eval(\`export const \${key} = module.exports.\${key};\`);
			} catch (e) {
				// Ignore errors for invalid identifiers
			}
		}
	}
}
`;
	}

	return source;
}