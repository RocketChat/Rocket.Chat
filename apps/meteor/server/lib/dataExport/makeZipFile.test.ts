import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { expect } from 'chai';

import { makeZipFile } from './makeZipFile';

describe('makeZipFile', () => {
	let workDir: string;
	let sourceDir: string;

	before(async () => {
		workDir = await mkdtemp(join(tmpdir(), 'make-zip-file-'));
		sourceDir = join(workDir, 'source');
		await mkdir(sourceDir);
		await writeFile(join(sourceDir, 'hello.txt'), 'hello');
	});

	after(async () => {
		await rm(workDir, { recursive: true, force: true });
	});

	it('should write the zip file and resolve', async () => {
		const target = join(workDir, 'out.zip');

		await makeZipFile(sourceDir, target);

		expect((await stat(target)).size).to.be.greaterThan(0);
	});

	it('should reject when the target file cannot be written', { timeout: 5000 }, async () => {
		const unwritableTarget = join(workDir, 'missing-directory', 'out.zip');

		await expect(makeZipFile(sourceDir, unwritableTarget)).to.be.rejectedWith(/ENOENT/);
	});
});
