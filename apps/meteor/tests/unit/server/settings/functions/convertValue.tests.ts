import { expect } from 'chai';

import { convertValue } from '../../../../../server/settings/functions/convertValue';

describe('convertValue', () => {
	(['true', 'True', 'TRUE'] as const).forEach((value) => {
		it(`should convert '${value}' to true`, () => {
			expect(convertValue(value, 'string')).to.be.equal(true);
		});
	});

	(['false', 'False', 'FALSE'] as const).forEach((value) => {
		it(`should convert '${value}' to false`, () => {
			expect(convertValue(value, 'string')).to.be.equal(false);
		});
	});

	(['int', 'timespan'] as const).forEach((type) => {
		describe(type, () => {
			const validValues: [string, number][] = [
				['0', 0],
				['10', 10],
				['-5', -5],
				['+5', 5],
				['  7  ', 7],
				['9007199254740991', 9007199254740991],
			];

			validValues.forEach(([value, expected]) => {
				it(`should convert '${value}' to ${expected}`, () => {
					expect(convertValue(value, type)).to.be.equal(expected);
				});
			});

			const invalidValues = [
				'',
				'   ',
				'abc',
				'30d',
				'30 days',
				'10px',
				'1.5',
				'.5',
				'1e3',
				'0x10',
				'NaN',
				'Infinity',
				'-Infinity',
				'1,000',
				'1_000',
				'--1',
				'9007199254740993',
			];

			invalidValues.forEach((value) => {
				it(`should throw on '${value}'`, () => {
					expect(() => convertValue(value, type)).to.throw(`Invalid integer value "${value}"`);
				});
			});
		});
	});

	describe('multiSelect', () => {
		it('should parse a JSON array', () => {
			expect(convertValue('["a","b"]', 'multiSelect')).to.be.deep.equal(['a', 'b']);
		});

		it('should throw on malformed JSON', () => {
			expect(() => convertValue('[a,b', 'multiSelect')).to.throw();
		});
	});

	describe('other types', () => {
		it('should return the raw string', () => {
			expect(convertValue('some value', 'string')).to.be.equal('some value');
		});
	});
});
