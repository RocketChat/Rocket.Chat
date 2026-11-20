import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';

import * as ts from 'typescript';
import { z } from 'zod';

const loadCommonJS = createRequire(__filename);
const entryPoints = ['zod', 'zod/v4', 'zod/mini', 'zod/v4/mini', 'zod/v4/core'];

test('ESM and CommonJS consumers reject unavailable locale barrels while accepting explicit locales', () => {
	const source = `
import { z } from 'zod';
import * as classic from 'zod/v4';
import * as mini from 'zod/mini';
import * as v4Mini from 'zod/v4/mini';
import * as core from 'zod/v4/core';
import en from 'zod/v4/locales/en.js';
z.string().parse('value');
classic.string().parse('value');
mini.parse(mini.string(), 'value');
v4Mini.parse(v4Mini.string(), 'value');
core.config(en());
z.config(en());
${['z', 'classic', 'mini', 'v4Mini', 'core', 'z.core', 'mini.core']
	.map((entry) => `// @ts-expect-error The locale barrel is unavailable at runtime.\n${entry}.locales;`)
	.join('\n')}
`;
	const options: ts.CompilerOptions = {
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		target: ts.ScriptTarget.ESNext,
		strict: true,
		noEmit: true,
		skipLibCheck: true,
		types: [],
	};
	const fixtures = ['mts', 'cts'].map((extension) => join(__dirname, `zod-locale-consumer.${extension}`));
	const host = ts.createCompilerHost(options);
	const { getSourceFile } = host;
	host.getSourceFile = (fileName, languageVersion, ...args) =>
		fixtures.includes(fileName)
			? ts.createSourceFile(fileName, source, languageVersion)
			: getSourceFile(fileName, languageVersion, ...args);
	const program = ts.createProgram(fixtures, options, host);
	const diagnostics = ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
	assert.deepEqual(diagnostics, []);
});

test('both runtime formats omit locale barrels and preserve explicit English error messages', async () => {
	// Exercise ESM export conditions independently of the test runner's CommonJS imports.
	for (const entry of entryPoints) {
		for (const namespace of [await import(entry), loadCommonJS(entry)]) {
			assert.equal('locales' in namespace, false, entry);
			if ('core' in namespace) {
				assert.equal('locales' in namespace.core, false, `${entry}.core`);
			}
		}
	}

	for (const locale of [(await import('zod/v4/locales/en.js')).default, loadCommonJS('zod/v4/locales/en.js').default]) {
		const result = z.string().safeParse(1, { error: locale().localeError });
		assert.equal(result.success, false);
		assert.equal(result.error?.issues[0].message, 'Invalid input: expected string, received number');
	}
});
