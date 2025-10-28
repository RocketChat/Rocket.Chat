import { describe, expect, it } from '@jest/globals';

import { parseTimestamp } from '../../src/eventParser/parseTimestamp';

describe('parseTimestamp', () => {
	it('should parse a valid timestamp', () => {
		const timestamp = '1709123456789123';
		const result = parseTimestamp(timestamp);

		expect(result).toBeInstanceOf(Date);
		expect(result?.getTime()).toBe(1709123456789);
	});

	it('should return undefined for undefined input', () => {
		const result = parseTimestamp(undefined);

		expect(result).toBeUndefined();
	});

	it('should return undefined for zero timestamp', () => {
		const result = parseTimestamp('0');

		expect(result).toBeUndefined();
	});

	it('should return undefined for invalid timestamp', () => {
		const result = parseTimestamp('invalid');

		expect(result).toBeUndefined();
	});

	it('should return undefined for negative timestamp', () => {
		const result = parseTimestamp('-1709123456789');

		expect(result).toBeUndefined();
	});
});
