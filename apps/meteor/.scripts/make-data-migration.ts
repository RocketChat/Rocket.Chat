import { readdirSync, readFileSync, writeFileSync } from 'fs';

import { renderFile } from 'template-file';

function getNextOrder(fileList: string[]): number {
	let max = 0;
	for (const file of fileList) {
		const match = file.match(/^(\d{5})_/);
		if (match) {
			const num = parseInt(match[1], 10);
			if (num > max) {
				max = num;
			}
		}
	}
	return max + 1;
}

function padOrder(order: number): string {
	return String(order).padStart(5, '0');
}

function main(id: string, description: string): void {
	const normalizedId = id.trim();

	if (!normalizedId) {
		console.error('1st param must be a non-empty migration id');
		process.exitCode = 1;
		return;
	}

	if (!/^[a-z0-9-]+$/.test(normalizedId)) {
		console.error('1st param must use lowercase letters, numbers, and hyphens only');
		process.exitCode = 1;
		return;
	}

	if (!description.trim()) {
		console.error('2nd param must be a non-empty description');
		process.exitCode = 1;
		return;
	}

	const fileList = readdirSync('./server/startup/dataMigrations');

	// check if migration id already exists
	const existingWithId = fileList.find((f) => f.replace(/^\d{5}_/, '') === `${normalizedId}.ts`);
	if (existingWithId) {
		console.error(`Data migration with id "${id}" already exists as ${existingWithId}`);
		process.exitCode = 1;
		return;
	}

	const order = getNextOrder(fileList);
	const fileName = `${padOrder(order)}_${normalizedId}`;

	renderFile('./.scripts/data-migration.template', { id: normalizedId, description, order })
		.then((renderedMigration) => {
			// generate new migration file
			writeFileSync(`./server/startup/dataMigrations/${fileName}.ts`, renderedMigration);

			// get contents of index.ts to append new migration
			const indexFile = readFileSync('./server/startup/dataMigrations/index.ts');
			const lines = indexFile.toString();

			const data = `${lines.trimEnd()}\nimport './${fileName}';\n`;

			// append migration import to index file
			writeFileSync('./server/startup/dataMigrations/index.ts', data);
			console.log(`Data migration "${fileName}" created with order ${order}`);
		})
		.catch((error: any) => {
			console.error(error);
			process.exitCode = 1;
		});
}

const [, , id, ...descriptionParts] = process.argv;
const description = descriptionParts.join(' ');

if (!id || !description.trim()) {
	console.error('Usage:\n\tmeteor npm run data-migration:add <migration-id> <description>\n');
	process.exit(1);
}

main(id, description);
