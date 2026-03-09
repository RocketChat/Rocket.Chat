import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function findTestFiles(dir: string): string[] {
	const result: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			result.push(...findTestFiles(fullPath));
		} else if (entry.name.endsWith('.test.ts')) {
			result.push(fullPath);
		}
	}
	return result;
}

const testDir = join(__dirname, 'node-tests');
const files = findTestFiles(testDir);

for (const file of files) {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require(file);
}
