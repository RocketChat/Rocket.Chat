import * as path from 'path';

import * as ts from 'typescript';

import { extractEndpoints } from '../endpoints';
import { createProgram, main } from '../main';
import { getFormattedFilename } from '../utils';

jest.mock('typescript', () => ({
	...jest.requireActual('typescript'),
	createProgram: jest.fn(),
	sys: {
		readFile: jest.fn(),
	},
}));

jest.mock('../utils', () => ({
	getFormattedFilename: jest.fn(),
}));

jest.mock('../endpoints', () => ({
	extractEndpoints: jest.fn(),
}));

describe('main.ts', () => {
	let mockProgram: ts.Program;
	let mockSourceFile: ts.SourceFile;
	let mockChecker: ts.TypeChecker;

	beforeEach(() => {
		mockSourceFile = {
			fileName: 'mockFile.ts',
			isDeclarationFile: false,
		} as ts.SourceFile;

		mockChecker = {} as ts.TypeChecker;

		mockProgram = {
			getSourceFiles: jest.fn().mockReturnValue([mockSourceFile]),
			getTypeChecker: jest.fn().mockReturnValue(mockChecker),
		} as unknown as ts.Program;

		(ts.createProgram as jest.Mock).mockReturnValue(mockProgram);
		(ts.sys.readFile as jest.Mock).mockReturnValue('mock file content');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createProgram', () => {
		it('should create a TypeScript program', () => {
			const program = createProgram();
			expect(ts.createProgram).toHaveBeenCalledWith([path.join(__dirname, '../../index.ts')], {
				target: ts.ScriptTarget.ES2015,
				module: ts.ModuleKind.ESNext,
			});
			expect(program).toBe(mockProgram);
		});

		it('should log an error and exit if the file cannot be read', () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn());
			const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
				throw new Error('process.exit called');
			});
			(ts.sys.readFile as jest.Mock).mockReturnValue(undefined);

			expect(() => createProgram()).toThrow('process.exit called');
			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Could not read file:'));
			expect(exitSpy).toHaveBeenCalledWith(1);
		});
	});

	describe('main', () => {
		it('should return endpoints from all non-declaration files', () => {
			const mockFormattedFilename = 'MOCK FILE';
			const mockEndpoints = { mockEndpoint: {} };

			(getFormattedFilename as jest.Mock).mockReturnValue(mockFormattedFilename);
			(extractEndpoints as jest.Mock).mockReturnValue(mockEndpoints);

			const result = main();

			expect(getFormattedFilename).toHaveBeenCalledWith('mockFile.ts');
			expect(extractEndpoints).toHaveBeenCalledWith(mockSourceFile, mockChecker);
			expect(result).toEqual({ [mockFormattedFilename]: mockEndpoints });
		});

		it('should skip files with no endpoints', () => {
			(extractEndpoints as jest.Mock).mockReturnValue({});

			const result = main();

			expect(result).toEqual({});
		});

		it('should log the endpoints to the console', () => {
			const consoleSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn());
			const mockFormattedFilename = 'MOCK FILE';
			const mockEndpoints = { mockEndpoint: {} };

			(getFormattedFilename as jest.Mock).mockReturnValue(mockFormattedFilename);
			(extractEndpoints as jest.Mock).mockReturnValue(mockEndpoints);

			main();

			expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify({ [mockFormattedFilename]: mockEndpoints }));
		});
	});
});
