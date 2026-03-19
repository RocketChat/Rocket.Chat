import { isNodeOfType } from '../src';

describe('isNodeOfType', () => {
	it('returns true when node type matches', () => {
		const node = { type: 'PLAIN_TEXT', value: 'hello' };
		expect(isNodeOfType(node, 'PLAIN_TEXT')).toBe(true);
	});

	it('returns false for null', () => {
		expect(isNodeOfType(null, 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isNodeOfType(undefined, 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false for a plain string', () => {
		expect(isNodeOfType('hello', 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false when type does not match', () => {
		const node = { type: 'BOLD', value: 'hello' };
		expect(isNodeOfType(node, 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false for object missing type field', () => {
		expect(isNodeOfType({ value: 'hello' }, 'PLAIN_TEXT')).toBe(false);
	});
});