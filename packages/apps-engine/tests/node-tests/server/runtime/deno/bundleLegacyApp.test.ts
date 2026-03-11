import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { AppImplements } from '../../../../../src/server/compiler/AppImplements';
import type { IParseAppPackageResult } from '../../../../../src/server/compiler/IParseAppPackageResult';
import { bundleLegacyApp } from '../../../../../src/server/runtime/deno/bundler';

function makeAppPackage(classFile: string, files: { [key: string]: string }): IParseAppPackageResult {
	return {
		info: {
			id: 'test-app',
			name: 'Test App',
			nameSlug: 'test-app',
			version: '0.0.1',
			description: 'Test App',
			requiredApiVersion: '*',
			classFile,
			iconFile: 'icon.png',
			implements: [],
			author: { name: 'Test', homepage: 'https://test.com', support: 'https://test.com' },
		},
		files,
		languageContent: {},
		implemented: {} as AppImplements,
	};
}

describe('bundleLegacyApp', () => {
	it('bundles a single-file app into one output file', async () => {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'module.exports = { hello: "world" };',
		});

		await bundleLegacyApp(appPackage);

		// After bundling, files should contain only the single bundled entry
		assert.strictEqual(Object.keys(appPackage.files).length, 1);
		assert.ok(appPackage.files['app.js'] !== undefined);
		assert.strictEqual(typeof appPackage.files['app.js'], 'string');
		assert.ok(appPackage.files['app.js'].length > 0);
	});

	it('includes code from relative imports', async () => {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'var utils = require("./utils"); module.exports = utils;',
			'utils.js': 'module.exports = { value: 42 };',
		});

		await bundleLegacyApp(appPackage);

		assert.strictEqual(Object.keys(appPackage.files).length, 1);
		// The bundled output should contain the inlined value from utils.js
		assert.ok(appPackage.files['app.js'].includes('42'));
	});

	it('resolves directory index imports (require("./dir") → dir/index.js)', async () => {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'var lib = require("./lib"); module.exports = lib;',
			'lib/index.js': 'module.exports = { fromIndex: true };',
		});

		await bundleLegacyApp(appPackage);

		assert.strictEqual(Object.keys(appPackage.files).length, 1);
		assert.ok(appPackage.files['app.js'].includes('fromIndex'));
	});

	it('marks @rocket.chat/apps-engine/* imports as external', async () => {
		const appPackage = makeAppPackage('app.js', {
			'app.js': [
				'var AppInterface = require("@rocket.chat/apps-engine/definition/AppInterface");',
				'module.exports = AppInterface;',
			].join('\n'),
		});

		await bundleLegacyApp(appPackage);

		assert.strictEqual(Object.keys(appPackage.files).length, 1);
		// The apps-engine import should remain as an external require, not be inlined
		assert.ok(appPackage.files['app.js'].includes('@rocket.chat/apps-engine'));
	});

	it('handles deeply nested relative imports', async () => {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'var a = require("./commands/run"); module.exports = a;',
			'commands/run.js': 'var helper = require("../helpers/format"); module.exports = helper;',
			'helpers/format.js': 'module.exports = { formatted: true };',
		});

		await bundleLegacyApp(appPackage);

		assert.strictEqual(Object.keys(appPackage.files).length, 1);
		assert.ok(appPackage.files['app.js'].includes('formatted'));
	});

	it('replaces the files record with only the bundled classFile entry', async () => {
		const appPackage = makeAppPackage('main.js', {
			'main.js': 'var dep = require("./dep"); module.exports = dep;',
			'dep.js': 'module.exports = "dep-value";',
			'unused.js': 'module.exports = "unused";',
		});

		await bundleLegacyApp(appPackage);

		// Only the classFile key should remain after bundling
		assert.deepStrictEqual(Object.keys(appPackage.files), ['main.js']);
	});
});
