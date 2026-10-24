import { describe, it, expect } from '@jest/globals';

import { truncateString } from './truncateString';

describe('truncateString', () => {
	it('should return the original string if length is less than maxLength', () => {
		expect(truncateString('hello', 10)).toBe('hello');
	});

	it('should return the original string if length is exactly equal to maxLength', () => {
		expect(truncateString('hello', 5)).toBe('hello');
	});

	it('should truncate and append ellipses when length exceeds maxLength by default', () => {
		expect(truncateString('hello world', 8)).toBe('hello...');
	});

	it('should ensure the truncated string with ellipses matches maxLength exactly', () => {
		const result = truncateString('The quick brown fox jumps over the lazy dog', 15);
		expect(result).toBe('The quick br...');
		expect(result.length).toBe(15);
	});

	it('should truncate without ellipses when shouldAddEllipses is explicitly false', () => {
		expect(truncateString('hello world', 5, false)).toBe('hello');
	});

	it('should slice without ellipses when maxLength is less than or equal to ellipsis length (3)', () => {
		expect(truncateString('hello', 3)).toBe('hel');
		expect(truncateString('hello', 2)).toBe('he');
		expect(truncateString('hello', 1)).toBe('h');
	});

	it('should return empty string when maxLength is 0 and string is longer', () => {
		expect(truncateString('hello', 0)).toBe('');
	});

	it('should handle an empty string input correctly', () => {
		expect(truncateString('', 0)).toBe('');
		expect(truncateString('', 5)).toBe('');
	});

	it('should correctly truncate unicode strings', () => {
		expect(truncateString('🚀 Rocket.Chat', 10)).toBe('🚀 Rock...');
	});
});
