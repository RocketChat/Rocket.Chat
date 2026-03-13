import { AsyncTest, Expect, TestFixture } from 'alsatian';

import type { AppImplements } from '../../../../src/server/compiler/AppImplements';
import type { IParseAppPackageResult } from '../../../../src/server/compiler/IParseAppPackageResult';
import { bundleLegacyApp } from '../../../../src/server/runtime/deno/bundler';

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

@TestFixture('bundleLegacyApp')
export class BundleLegacyAppTestFixture {
	@AsyncTest('bundles a single-file app into one output file')
	public async testSingleFileApp() {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'module.exports = { hello: "world" };',
		});

		await bundleLegacyApp(appPackage);

		// After bundling, files should contain only the single bundled entry
		Expect(Object.keys(appPackage.files).length).toBe(1);
		Expect(appPackage.files['app.js']).toBeDefined();
		Expect(typeof appPackage.files['app.js']).toBe('string');
		Expect(appPackage.files['app.js'].length).toBeGreaterThan(0);
	}

	@AsyncTest('includes code from relative imports')
	public async testRelativeImports() {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'var utils = require("./utils"); module.exports = utils;',
			'utils.js': 'module.exports = { value: 42 };',
		});

		await bundleLegacyApp(appPackage);

		Expect(Object.keys(appPackage.files).length).toBe(1);
		// The bundled output should contain the inlined value from utils.js
		Expect(appPackage.files['app.js']).toContain('42');
	}

	@AsyncTest('resolves directory index imports (require("./dir") → dir/index.js)')
	public async testDirectoryIndexImports() {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'var lib = require("./lib"); module.exports = lib;',
			'lib/index.js': 'module.exports = { fromIndex: true };',
		});

		await bundleLegacyApp(appPackage);

		Expect(Object.keys(appPackage.files).length).toBe(1);
		Expect(appPackage.files['app.js']).toContain('fromIndex');
	}

	@AsyncTest('marks @rocket.chat/apps-engine/* imports as external')
	public async testExternalAppsEngineImports() {
		const appPackage = makeAppPackage('app.js', {
			'app.js': [
				'var AppInterface = require("@rocket.chat/apps-engine/definition/AppInterface");',
				'module.exports = AppInterface;',
			].join('\n'),
		});

		await bundleLegacyApp(appPackage);

		Expect(Object.keys(appPackage.files).length).toBe(1);
		// The apps-engine import should remain as an external require, not be inlined
		Expect(appPackage.files['app.js']).toContain('@rocket.chat/apps-engine');
	}

	@AsyncTest('handles deeply nested relative imports')
	public async testDeeplyNestedImports() {
		const appPackage = makeAppPackage('app.js', {
			'app.js': 'var a = require("./commands/run"); module.exports = a;',
			'commands/run.js': 'var helper = require("../helpers/format"); module.exports = helper;',
			'helpers/format.js': 'module.exports = { formatted: true };',
		});

		await bundleLegacyApp(appPackage);

		Expect(Object.keys(appPackage.files).length).toBe(1);
		Expect(appPackage.files['app.js']).toContain('formatted');
	}

	@AsyncTest('replaces the files record with only the bundled classFile entry')
	public async testReplacesFilesRecord() {
		const appPackage = makeAppPackage('main.js', {
			'main.js': 'var dep = require("./dep"); module.exports = dep;',
			'dep.js': 'module.exports = "dep-value";',
			'unused.js': 'module.exports = "unused";',
		});

		await bundleLegacyApp(appPackage);

		// Only the classFile key should remain after bundling
		Expect(Object.keys(appPackage.files)).toEqual(['main.js']);
	}
}
