import { isRecord } from './isRecord';

describe('isRecord', () => {
	test.each([
		['case-1', undefined, false],
		['case-2', null, false],
		['case-3', 0, false],
		['case-4', false, false],
		['case-5', '', false],
	])('should return false for falsy values %# (%s)', (_caseId, input, expected) => {
		expect(isRecord(input)).toEqual(expected);
	});

	test.each([
		['case-1', undefined, false],
		['case-2', null, false],
		['case-3', 20, false],
		['case-4', true, false],
		['case-5', 'string', false],
	])('should return false for non-objects %# (%s)', (_caseId, input, expected) => {
		expect(isRecord(input)).toEqual(expected);
	});

	test.each([
		['case-1', {}, true],
		['case-2', { prop: 'value' }, true],
		['case-3', Object.fromEntries([]), true],
		['case-4', Object.create(null), true],
		['case-5', { 0: 'zero', 1: 'one' }, true],
		['case-6', { [Symbol('key')]: 'value' }, true],
		['case-7', new String('string'), false],
		['case-8', new Number(1), false],
	])('should return true for records %# (%s)', (_caseId, input, expected) => {
		expect(isRecord(input)).toEqual(expected);
	});

	test.each([
		['case-1', new Date(), false],
		['case-2', [], false],
		['case-2', [{}], false],
	])('should return false for objects that are not records %# (%s)', (_caseId, input, expected) => {
		expect(isRecord(input)).toEqual(expected);
	});
});
