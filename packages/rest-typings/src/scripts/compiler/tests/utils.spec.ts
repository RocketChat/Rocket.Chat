import { getFormattedFilename } from '../utils';

describe('getFormattedFilename', () => {
	it('should return an uppercase filename with "Endpoints" appended', () => {
		const result = getFormattedFilename('/path/to/file.ts');
		expect(result).toBe('FILE ENDPOINTS');
	});

	it('should handle paths with multiple directories', () => {
		const result = getFormattedFilename('/deep/path/to/some/file.js');
		expect(result).toBe('FILE ENDPOINTS');
	});

	it('should handle filenames with multiple dots', () => {
		const result = getFormattedFilename('/path/to/file.test.ts');
		expect(result).toBe('FILE.TEST ENDPOINTS');
	});

	it('should return an empty string for invalid paths', () => {
		const result = getFormattedFilename('/path/without/filename/');
		expect(result).toBe('');
	});

	it('should handle root-level files', () => {
		const result = getFormattedFilename('file.txt');
		expect(result).toBe('FILE ENDPOINTS');
	});
});
