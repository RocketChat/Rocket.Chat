import { readdirSync, readFileSync, writeFileSync } from 'fs';

import { renderFile } from 'template-file';

function main(number: string, comment: string): void {
	if (!(Number(number) >= 0)) {
		console.error(`1st param must be a valid number. ${number} provided`);
		return;
	}

	if (comment.trim()) {
		comment = `// ${comment}`;
	}

	// check if migration will conflict with current on-branch migrations
	const migrationName = `v${number}`;
	const fileList = readdirSync('./server/startup/migrations');
	if (fileList.includes(`${migrationName}.ts`)) {
		console.error('Migration with specified number already exists');
		return;
	}

	renderFile('./.scripts/migration.template', { number, comment })
		.then((renderedMigration) => {
			// generate new migration file
			writeFileSync(`./server/startup/migrations/${migrationName}.ts`, renderedMigration);

			// get contents of index.ts to append new migration
			const indexFile = readFileSync('./server/startup/migrations/index.ts');
			const splittedIndexLines = indexFile.toString().split('\n');

			// remove end line + xrun import
			splittedIndexLines.splice(splittedIndexLines.length - 2, 0, `import './${migrationName}';`);
			const data = splittedIndexLines.join('\n');

			// append migration import to indexfile
			writeFileSync('./server/startup/migrations/index.ts', data);
			console.log(`Migration ${migrationName} created`);
		})
		.catch(console.error);
}

const [, , number, comment = ''] = process.argv;

if (!number || (comment && !comment.trim())) {
	console.error('Usage:\n\tmeteor npm run migration:add <migration number> [migration comment: optional]\n');
	process.exit(1);
}

main(number, comment);
