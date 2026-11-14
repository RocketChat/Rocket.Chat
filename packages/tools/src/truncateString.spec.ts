import { truncateString } from './truncateString';

describe('truncateString', () => {
	it('preserves the existing string when it is within the limit', () => {
		expect(truncateString('hello', 5)).toBe('hello');
	});

	it('does not split a surrogate pair when adding ellipses', () => {
		expect(truncateString('1234😀tail', 8)).toBe('1234...');
	});

	it('does not split a surrogate pair when ellipses are disabled', () => {
		expect(truncateString('1234😀tail', 5, false)).toBe('1234');
	});

	it('does not split a surrogate pair when the limit is shorter than the ellipsis', () => {
		expect(truncateString('😀tail', 1)).toBe('');
	});

	it('preserves a complete surrogate pair before the truncation boundary', () => {
		expect(truncateString('1234😀tail', 6, false)).toBe('1234😀');
	});

	it('keeps ASCII truncation and ellipsis behavior unchanged', () => {
		expect(truncateString('hello world', 8)).toBe('hello...');
		expect(truncateString('hello world', 5, false)).toBe('hello');
	});
});
