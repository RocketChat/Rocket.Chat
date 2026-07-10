const ALLOWED_MODULES = [
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
	// External libraries
	'uuid',
	'@rocket.chat/apps-engine',
];

// As the apps are bundled, the only times they will call require are
// 1. To require native modules
// 2. To require external npm packages we may provide
// 3. To require apps-engine files
export const sandboxRequire = (module: string) => {
	// Normalize Node built-in specifiers: accept both 'crypto' and 'node:crypto'
	const normalized = module.replace('node:', '');

	// We allow variants like 'fs', 'node:fs' or 'node:fs/promises', or even '@rocket.chat/apps-engine/**'
	if (!ALLOWED_MODULES.some((mod) => normalized.startsWith(mod))) {
		throw new Error(`Module ${module} is not allowed`);
	}

	// This is THE purpose of this function, we can't escape a dinamyc require call
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, import/no-dynamic-require, @typescript-eslint/no-require-imports
	return require(normalized);
};
