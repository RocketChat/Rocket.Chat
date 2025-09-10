import { filterOutMissingData } from '../../src/eventParser/filterOutMissingData';

describe('filterOutMissingData', () => {
	test.each([
		['case-1', { a: '1', b: '', c: '0', d: undefined }, { a: '1' }],
		['case-2', { a: true, b: false, c: '0' }, { a: true, b: false }],
		['case-3', { a: { b: {} }, c: { d: '1' } }, { c: { d: '1' } }],
		['case-4', { a: [], b: [1], c: {} }, { a: [], b: [1] }],
		['case-5', { a: new Date(), b: {} }, { a: expect.any(Date) }],
		['case-6', {}, {}],
	])('should filter out missing data for test %# (%s)', (_caseId, input, expected) => {
		expect(filterOutMissingData(input)).toEqual(expected);
	});
});
