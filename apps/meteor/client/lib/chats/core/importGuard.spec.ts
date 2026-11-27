import fs from 'fs';
import os from 'os';
import path from 'path';

import { CLIENT_ROOT, walkImports } from '../importGraph';

const isSpec = (name: string) => /\.(spec|test)\.tsx?$/.test(name);

const coreEntries = (): string[] =>
	fs
		.readdirSync(__dirname)
		.filter((name) => /\.tsx?$/.test(name) && !isSpec(name))
		.map((name) => path.join(__dirname, name));

describe('chats/core import graph', () => {
	it('has cores to guard', () => {
		expect(coreEntries().length).toBeGreaterThan(0);
	});

	it.each(coreEntries().map((file) => [path.basename(file), file]))('%s reaches no web singleton or UI module', (_name, file) => {
		expect(walkImports([file]).violations).toEqual([]);
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

	const toClient = (relativeToClient: string) => path.relative(dir, path.join(CLIENT_ROOT, relativeToClient)).split(path.sep).join('/');

	it('flags a forbidden relative import', () => {
		const entry = write('bad.ts', `import { sdk } from '${toClient('lib/SDKClient')}';\nexport const x = sdk;\n`);

		expect(walkImports([entry]).violations).toEqual([expect.stringContaining('forbidden module')]);
	});

	it('flags a forbidden module reached through a relative chain', () => {
		const entry = write('entry.ts', `import { helper } from './nested/helper';\nexport const x = helper;\n`);
		write('nested/helper.ts', `import { Messages } from '${toClient('stores')}';\nexport const helper = Messages;\n`);

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
				expect.stringContaining("forbidden package 'meteor/meteor'"),
				expect.stringContaining("dynamic import or require of './later'"),
				expect.stringContaining("dynamic import or require of 'x'"),
			]),
		);
	});

	it('flags a forbidden re-export', () => {
		const entry = write('entry.ts', `export { sdk } from '${toClient('lib/SDKClient')}';\n`);

		expect(walkImports([entry]).violations).toHaveLength(1);
	});

	it('ignores type-only imports, which are erased', () => {
		const entry = write(
			'entry.ts',
			`import type { sdk } from '${toClient('lib/SDKClient')}';\nimport { type Messages } from '${toClient('stores')}';\nexport type T = typeof sdk | typeof Messages;\n`,
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

		const report = walkImports([entry]);

		expect(report.violations).toEqual([]);
		expect(report.packages.get('dompurify')).toEqual([entry]);
	});
});
