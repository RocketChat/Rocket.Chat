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
	const normalized = module.replace(/^node:/, '');

	// A specifier is allowed only when it is exactly an allowed module or a subpath
	// of one (e.g. 'fs/promises', '@rocket.chat/apps-engine/**'). We must not use a
	// bare `startsWith(mod)`: it would let lookalike packages like 'fsevents' (starts
	// with 'fs') through. We also reject any '..' segment so a subpath cannot escape
	// an allowed module's directory (e.g. 'uuid/../../../some/file').
	const hasTraversal = normalized.split('/').includes('..');
	const isAllowed = !hasTraversal && ALLOWED_MODULES.some((mod) => normalized === mod || normalized.startsWith(`${mod}/`));

	if (!isAllowed) {
		throw new Error(`Module ${module} is not allowed`);
	}

	// This is THE purpose of this function, we can't escape a dinamyc require call
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return, import/no-dynamic-require, @typescript-eslint/no-require-imports
	return require(normalized);
};
