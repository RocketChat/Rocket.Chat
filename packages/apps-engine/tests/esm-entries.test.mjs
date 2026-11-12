import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const definitionDir = join(import.meta.dirname, '..', 'definition');

const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});

// Interop markers Node adds to every CommonJS module, not part of the package's API.
const isApiName = (name) => name !== '__esModule' && name !== 'module.exports' && name !== 'default';

const subpaths = walk(definitionDir)
	.filter((path) => path.endsWith('.js'))
	.map((path) => relative(definitionDir, path).split('\\').join('/').replace(/\.js$/, ''));

describe('the ES module entries of `@rocket.chat/apps-engine`', () => {
	for (const subpath of subpaths) {
		it(`exposes the CommonJS module \`definition/${subpath}\` unchanged`, async () => {
			const specifier = `@rocket.chat/apps-engine/definition/${subpath}`;
			// oxlint-disable-next-line import/no-dynamic-require -- every module of the build is checked
			const cjs = require(specifier);
			const esm = await import(specifier);

			// oxlint-disable-next-line import/no-dynamic-require -- every module of the build is checked
			assert.equal(require(`${specifier}.js`), cjs);
			assert.equal(await import(`${specifier}.js`), esm);
			assert.equal(esm.default, cjs, 'the default export is not the CommonJS `module.exports`');
			const names = Object.keys(esm).filter(isApiName).sort();
			assert.deepEqual(names, Object.keys(cjs).filter(isApiName).sort());

			for (const name of names) {
				assert.equal(esm[name], cjs[name], `\`${name}\` differs between formats`);
			}
		});
	}

	it('lists every name explicitly, since prebundlers cannot see through `export *` from CommonJS', () => {
		const esmDir = join(import.meta.dirname, '..', 'esm', 'definition');
		const stars = walk(esmDir).filter((path) => path.endsWith('.js') && /^export \*/m.test(readFileSync(path, 'utf8')));

		assert.deepEqual(stars, []);
	});

	it('resolves a directory to its index in both formats', async () => {
		const cjs = require('@rocket.chat/apps-engine/definition/accessors');
		const esm = await import('@rocket.chat/apps-engine/definition/accessors');

		assert.equal(cjs, require('@rocket.chat/apps-engine/definition/accessors/index'));
		assert.equal(esm.HttpStatusCode, cjs.HttpStatusCode);
		assert.equal(esm.default, cjs);
	});
});
