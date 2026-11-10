// Gives the CommonJS build in `definition/` an ES module face without a second copy of its code:
// apps load the CommonJS modules, so ES module importers must share their classes (`instanceof` across the boundary).
// Each module gets an `esm/` entry re-exporting it, and each directory gets a file entry so `exports` can map
// extensionless directory specifiers (`definition/accessors`) for both formats.
// No declarations go in `esm/`: consumers emitting declarations must name every type by a path `exports` allows,
// so both formats read the ones in `definition/`.
// With `--watch`, entries follow the CommonJS build as `tsc --watch` adds modules.
import { existsSync, mkdirSync, readFileSync, readdirSync, watch, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const cjsRoot = join(root, 'definition');
const esmRoot = join(root, 'esm', 'definition');

const write = (file, content) => {
	if (existsSync(file) && readFileSync(file, 'utf8') === content) {
		return;
	}

	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, content);
};

const toSpecifier = (from, to) => {
	const spec = relative(dirname(from), to).split('\\').join('/');
	return spec.startsWith('.') ? spec : `./${spec}`;
};

const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? [path, ...walk(path)] : [path];
	});

const emit = () => {
	const paths = walk(cjsRoot);

	for (const path of paths) {
		if (!path.endsWith('.js')) {
			continue;
		}

		const esmFile = join(esmRoot, relative(cjsRoot, path));
		const target = toSpecifier(esmFile, path);
		write(esmFile, `export * from '${target}';\nexport { default } from '${target}';\n`);
	}

	for (const path of paths) {
		if (!existsSync(join(path, 'index.js'))) {
			continue;
		}

		const index = `./${relative(dirname(path), path)}/index.js`;
		const cjsEntry = `module.exports = require('${index}');\n`;
		if (existsSync(`${path}.js`) && readFileSync(`${path}.js`, 'utf8') !== cjsEntry) {
			throw new Error(`${relative(root, path)}: a module and a directory share this name`);
		}

		const esmPath = join(esmRoot, relative(cjsRoot, path));
		write(`${path}.js`, cjsEntry);
		write(`${path}.d.ts`, `export * from '${index}';\n`);
		write(`${esmPath}.js`, `export * from '${index}';\nexport { default } from '${index}';\n`);
	}

	write(join(root, 'esm', 'package.json'), `${JSON.stringify({ type: 'module' }, null, '\t')}\n`);
};

emit();

if (process.argv.includes('--watch')) {
	let pending;
	watch(cjsRoot, { recursive: true }, () => {
		clearTimeout(pending);
		pending = setTimeout(() => {
			try {
				emit();
			} catch (error) {
				console.error(error.message);
			}
		}, 100);
	});
}
