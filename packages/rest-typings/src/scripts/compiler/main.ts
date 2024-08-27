import * as path from 'path';

import * as ts from 'typescript';

import { extractEndpoints } from './endpoints';
import type { Program, SourceFile, IEndpoints } from './types';
import { getFormattedFilename } from './utils';

export function createProgram(): Program {
	const fileName = path.join(__dirname, '../../index.ts');
	const fileContent = ts.sys.readFile(fileName);

	if (!fileContent) {
		console.error(`Could not read file: ${fileName}`);
		process.exit(1);
	}

	return ts.createProgram([fileName], {
		target: ts.ScriptTarget.ES2015,
		module: ts.ModuleKind.ESNext,
	});
}

export function main(): IEndpoints {
	const program = createProgram();
	const checker = program.getTypeChecker();

	const endpoints: IEndpoints = {};
	const nonDeclarationFiles: SourceFile[] = program.getSourceFiles().filter((file) => !file.isDeclarationFile);

	nonDeclarationFiles.forEach((file) => {
		const filename = getFormattedFilename(file.fileName);
		const fileEndpoints = extractEndpoints(file, checker);

		if (Object.keys(fileEndpoints).length) {
			endpoints[filename] = fileEndpoints;
		}
	});

	// console.log(JSON.stringify(endpoints));
	return endpoints;
}

const apiData = main();
export default apiData;
