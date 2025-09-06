import { resolve, join, relative } from 'node:path';

const FIXTURES_PATH = relative(process.cwd(), resolve(__dirname, '../fixtures/files'));

export function getFilePath(fileName: string): string {
	return join(FIXTURES_PATH, fileName);
}
