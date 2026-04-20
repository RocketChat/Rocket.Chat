import { parse } from '../src';

describe('Skip Flags Regression (Complexity Audit)', () => {
	it('should parse nested formatting across multiple depths without throwing', () => {
		for (let d = 1; d <= 50; d++) {
			const input = `${'*'.repeat(d)}text${'*'.repeat(d)}`;
			expect(() => parse(input)).not.toThrow();
		}
	});

	it('should handle pathological unmatched markers without crashing', () => {
		const pathological = '*_~*_~*_~*_~*_~ hello'.repeat(5);
		expect(() => parse(pathological)).not.toThrow();
	});
});
