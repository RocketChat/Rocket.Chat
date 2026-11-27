import fs from 'fs';
import os from 'os';
import path from 'path';

import { ALLOWED_PACKAGES, APP_ROOT, FORBIDDEN_PATHS, forbiddenPathExists, readImports, walkImports } from '../importGraph';

const isSpec = (name: string) => /\.(spec|test)\.tsx?$/.test(name);

const coreEntries = (): string[] =>
	(fs.readdirSync(__dirname, { recursive: true }) as string[])
		.filter((name) => /\.tsx?$/.test(path.basename(name)) && !isSpec(path.basename(name)))
		.map((name) => path.join(__dirname, name));

describe('chats/core import graph', () => {
	it('has cores to guard', () => {
		expect(coreEntries().length).toBeGreaterThan(0);
	});

	it.each(FORBIDDEN_PATHS.map((entry) => [entry]))('forbidden path %s exists on disk', (entry) => {
		expect(forbiddenPathExists(entry)).toBe(true);
	});

	it.each(coreEntries().map((file) => [path.relative(__dirname, file), file]))(
		'%s reaches no web singleton or UI module',
		(_name, file) => {
			const report = walkImports([file]);

			expect(report.violations).toEqual([]);
			expect([...report.packages.keys()].filter((name) => !ALLOWED_PACKAGES.includes(name))).toEqual([]);
		},
	);

	it('allows exactly core-typings and emitter', () => {
		expect(ALLOWED_PACKAGES).toEqual(['@rocket.chat/core-typings', '@rocket.chat/emitter']);
	});
});

describe('import graph guard', () => {
	let dir: string;

	const write = (name: string, content: string): string => {
		const file = path.join(dir, name);
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, content);
		return file;
	};

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), 'import-guard-'));
	});

	afterEach(() => {
		fs.rmSync(dir, { recursive: true, force: true });
	});

	const toApp = (relativeToApp: string) => path.relative(dir, path.join(APP_ROOT, relativeToApp)).split(path.sep).join('/');

	it('flags a forbidden relative import', () => {
		const entry = write('bad.ts', `import { sdk } from '${toApp('client/lib/SDKClient')}';\nexport const x = sdk;\n`);

		expect(walkImports([entry]).violations).toEqual([expect.stringContaining('forbidden module')]);
	});

	it('flags a forbidden module reached through a relative chain', () => {
		const entry = write('entry.ts', `import { helper } from './nested/helper';\nexport const x = helper;\n`);
		write('nested/helper.ts', `import { Messages } from '${toApp('client/stores')}';\nexport const helper = Messages;\n`);

		const { violations } = walkImports([entry]);

		expect(violations).toHaveLength(1);
		expect(violations[0]).toContain('helper.ts');
	});

	it('flags a forbidden package, a dynamic import and a require', () => {
		const entry = write(
			'entry.ts',
			`import { Meteor } from 'meteor/meteor';\nexport const a = () => import('./later');\nexport const b = () => require('x');\nexport { Meteor };\n`,
		);

		const { violations } = walkImports([entry]);

		expect(violations).toEqual(
			expect.arrayContaining([
				expect.stringContaining("package 'meteor/meteor' outside the allow-list"),
				expect.stringContaining("dynamic import or require of './later'"),
				expect.stringContaining("dynamic import or require of 'x'"),
			]),
		);
	});

	it('flags a forbidden re-export', () => {
		const entry = write('entry.ts', `export { sdk } from '${toApp('client/lib/SDKClient')}';\n`);

		expect(walkImports([entry]).violations).toHaveLength(1);
	});

	it('ignores type-only imports, which are erased', () => {
		const entry = write(
			'entry.ts',
			`import type { sdk } from '${toApp('client/lib/SDKClient')}';\nimport { type Messages } from '${toApp('client/stores')}';\nexport type T = typeof sdk | typeof Messages;\n`,
		);

		expect(walkImports([entry]).violations).toEqual([]);
	});

	it('flags an import it cannot resolve instead of skipping it', () => {
		const entry = write('entry.ts', `import './missing';\n`);

		expect(walkImports([entry]).violations).toEqual([expect.stringContaining("cannot resolve './missing'")]);
	});

	it('lists third-party packages with the file that imports them and survives import cycles', () => {
		const entry = write('a.ts', `import './b';\nimport dompurify from 'dompurify';\nexport const a = dompurify;\n`);
		write('b.ts', `import './a';\n`);

		const report = walkImports([entry], { allowedPackages: ['dompurify'] });

		expect(report.violations).toEqual([]);
		expect(report.packages.get('dompurify')).toEqual([entry]);
	});

	it.each([
		['lib/baseURI', 'client/lib/baseURI'],
		['lib/sdk/storage', 'client/lib/sdk/storage'],
		['lib/sdk/ddpSdk', 'client/lib/sdk/ddpSdk'],
		['lib/RestApiClient', 'client/lib/RestApiClient'],
		['apps/meteor/lib/i18n.ts, outside client/', 'lib/i18n'],
		['lib/ChatMessages', 'client/lib/ChatMessages'],
	])('flags a value import of %s', (_name, target) => {
		const entry = write('entry.ts', `import { x } from '${toApp(target)}';\nexport const y = x;\n`);

		expect(walkImports([entry]).violations).toEqual([expect.stringContaining('forbidden module')]);
	});

	it('flags a value import of a forbidden file written with its .ts extension', () => {
		const entry = write('entry.ts', `import { sdk } from '${toApp('client/lib/SDKClient')}.ts';\nexport const x = sdk;\n`);

		expect(walkImports([entry]).violations).toEqual([expect.stringContaining('forbidden module')]);
	});

	it.each(['@tanstack/react-query', '@rocket.chat/fuselage-hooks', 'zustand', 'i18next', '@rocket.chat/ddp-client', 'react'])(
		'flags the package %s, which is outside the allow-list',
		(name) => {
			const entry = write('entry.ts', `import * as lib from '${name}';\nexport const x = lib;\n`);

			expect(walkImports([entry]).violations).toEqual([expect.stringContaining(`package '${name}' outside the allow-list`)]);
		},
	);

	it('accepts the allow-listed packages and their subpaths', () => {
		const entry = write(
			'entry.ts',
			`import { Emitter } from '@rocket.chat/emitter';\nimport { isEncryptedMessageContent } from '@rocket.chat/core-typings';\nexport const x = [Emitter, isEncryptedMessageContent];\n`,
		);

		expect(walkImports([entry]).violations).toEqual([]);
	});

	describe('comments, strings and regex literals', () => {
		it.each([
			[
				'a /* inside a string, then a re-export and a later block comment',
				(rel: string) => `export const a = 'image/*';\nexport { sdk } from '${rel}';\n/** doc */\n`,
			],
			[
				'a // inside a string on the same line as the import',
				(rel: string) => `const a = 'a//b'; import { sdk } from '${rel}';\nexport const x = [a, sdk];\n`,
			],
			[
				'a /* inside a regex class, then a dynamic import and a later block comment',
				(rel: string) => `export const r = /[/*]x/; export const f = () => import('${rel}');\n/* later */\n`,
			],
			[
				'a // inside a template literal, then an import',
				(rel: string) => `const a = \`https://x/\${1}//y\`; import { sdk } from '${rel}';\nexport const x = [a, sdk];\n`,
			],
		])('still finds the import after %s', (_name, source) => {
			const entry = write('entry.ts', source(toApp('client/lib/SDKClient')));

			expect(walkImports([entry]).violations).toEqual(expect.arrayContaining([expect.stringContaining('client/lib/SDKClient')]));
		});

		it('ignores an import that only appears in a comment', () => {
			const entry = write('entry.ts', `// import { sdk } from 'meteor/meteor';\n/* import 'meteor/meteor'; */\nexport const a = 1;\n`);

			expect(readImports(entry)).toEqual([]);
		});
	});
});
