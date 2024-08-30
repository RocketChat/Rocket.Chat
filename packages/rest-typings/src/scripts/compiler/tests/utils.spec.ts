import { getFormattedFilename } from '../utils';

describe('getFormattedFilename', () => {
	let consoleSpy;

	beforeEach(() => {
		consoleSpy = jest.spyOn(console, 'error').mockImplementation();
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it('should format a simple filename correctly', () => {
		const result = getFormattedFilename('/path/to/file.ts');
		expect(result).toBe('FILE ENDPOINTS');
	});

	it('should handle paths with multiple directories', () => {
		const result = getFormattedFilename('/deep/path/to/some/file.ts');
		expect(result).toBe('FILE ENDPOINTS');
	});

	it('should handle filenames with multiple extensions', () => {
		const result = getFormattedFilename('/path/to/file.spec.ts');
		expect(result).toBe('FILE.SPEC ENDPOINTS');
	});

	it('should handle filenames without extensions', () => {
		const result = getFormattedFilename('/path/to/file');
		expect(result).toBe('');
		expect(consoleSpy).toHaveBeenCalledWith('No fileName Found');
	});

	it('should handle paths with no filename', () => {
		const result = getFormattedFilename('/path/to/');
		expect(result).toBe('');
		expect(consoleSpy).toHaveBeenCalledWith('No fileName Found');
	});

	it('should handle empty string input', () => {
		const result = getFormattedFilename('');
		expect(result).toBe('');
		expect(consoleSpy).toHaveBeenCalledWith('No fileName Found');
	});

	it('should handle paths with spaces', () => {
		const result = getFormattedFilename('/path/to/my file.ts');
		expect(result).toBe('MY FILE ENDPOINTS');
	});

	it('should return an empty string and log an error when filename does not contain .ts extension', () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
		const result = getFormattedFilename('/path/to/file.txt');
		expect(result).toBe('');
		expect(consoleSpy).toHaveBeenCalledWith('No fileName Found');
		consoleSpy.mockRestore();
	});
});
