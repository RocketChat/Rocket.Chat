import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);

const ALLOWED_NATIVE_MODULES = [
	'path',
	'url',
	'crypto',
	'buffer',
	'stream',
	'net',
	'http',
	'https',
	'zlib',
	'util',
	'punycode',
	'os',
	'querystring',
	'fs',
];

const ALLOWED_EXTERNAL_MODULES = ['uuid', '@rocket.chat/apps-engine'];

// As the apps are bundled, the only times they will call require are
// 1. To require native modules
// 2. To require external npm packages we may provide
// 3. To require apps-engine files
export const require = (module: string) => {
	// Normalize Node built-in specifiers: accept both 'crypto' and 'node:crypto'
	const normalized = module.replace('node:', '');


	// We allow variants like 'fs', 'node:fs' or 'node:fs/promises'
	if (ALLOWED_NATIVE_MODULES.some((mod) => normalized.startsWith(mod))) {
		return _require(`node:${normalized}`);
	}

	if (ALLOWED_EXTERNAL_MODULES.some((mod) => module.startsWith(mod))) {
		// External modules cannot be resolved by the require algorithm, we need to pass the full path already resolved by Deno's import map
		return _require(import.meta.resolve(module).replace('file://', ''));
	}

	throw new Error(`Module ${module} is not allowed`);
};
