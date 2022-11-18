import { expect } from 'chai';

import { parseCSV } from '../../../../lib/utils/parseCSV';

describe('Parse CSV', () => {
	it('should return an empty array for an empty string', () => {
		const result = parseCSV('');

		expect(result).to.be.an('Array').with.lengthOf(0);
	});

	it('should return an array with one item', () => {
		const value = 'value';
		const result = parseCSV(value);

		expect(result).to.be.an('Array').with.lengthOf(1).and.eql([value]);
	});

	it('should trim surrounding spaces', () => {
		const value1 = 'value1';
		const value2 = 'value2';

		const csv = `${value1}, ${value2}`;
		const result = parseCSV(csv);

		expect(result).to.be.an('Array').with.lengthOf(2).and.eql([value1, value2]);
	});

	it('should ignore empty items', () => {
		const value1 = 'value1';
		const value2 = 'value2';

		const csv = `${value1}, , , , ${value2}`;
		const result = parseCSV(csv);

		expect(result).to.be.an('Array').with.lengthOf(2).and.eql([value1, value2]);
	});

	it('should not ignore empty items when requested', () => {
		const value1 = 'value1';
		const value2 = 'value2';

		const csv = `${value1}, , ${value2}`;
		const result = parseCSV(csv, false);

		expect(result).to.be.an('Array').with.lengthOf(3).and.eql([value1, '', value2]);
	});
});
