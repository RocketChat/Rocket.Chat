import { isNodeOfType } from '../src/guards';

describe('isNodeOfType', () => {
	it('returns true when value has matching type', () => {
		expect(isNodeOfType({ type: 'PLAIN_TEXT', value: 'hi' }, 'PLAIN_TEXT')).toBe(true);
	});

	it('returns false for null', () => {
		expect(isNodeOfType(null, 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false for non-object', () => {
		expect(isNodeOfType('string', 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false when type does not match', () => {
		expect(isNodeOfType({ type: 'BOLD', value: [] }, 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false when type property is missing', () => {
		expect(isNodeOfType({ value: 'hi' }, 'PLAIN_TEXT')).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isNodeOfType(undefined, 'PLAIN_TEXT')).toBe(false);
	});
});
