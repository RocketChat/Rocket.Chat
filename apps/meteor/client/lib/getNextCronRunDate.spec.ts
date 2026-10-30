import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { getNextCronRunDate } from './getNextCronRunDate';

// The test runner pins TZ=UTC, which has no DST, so these cases run in a child process with its own timezone.
const getNextCronRunDatesIn = (timeZone: string, cases: [expression: string, from: string][]): string[] => {
	const script = `${readFileSync(require.resolve('./getNextCronRunDate'), 'utf8')}
		const cases = ${JSON.stringify(cases)};
		console.log(JSON.stringify(cases.map(([expression, from]) => getNextCronRunDate(expression, new Date(from)).toISOString())));
	`;
	const output = execFileSync(process.execPath, ['--no-warnings', '--input-type=module-typescript', '--eval', script], {
		env: { ...process.env, TZ: timeZone },
		encoding: 'utf8',
	});
	return JSON.parse(output);
};

// Expected dates were produced by cron@1.8.2, which schedules the jobs on the server.
const from = new Date(2024, 5, 1, 10, 15, 0);

describe('getNextCronRunDate', () => {
	it.each([
		['*/30 * * * *', new Date(2024, 5, 1, 10, 30, 0)],
		['0 * * * *', new Date(2024, 5, 1, 11, 0, 0)],
		['0 */6 * * *', new Date(2024, 5, 1, 12, 0, 0)],
		['0 0 * * *', new Date(2024, 5, 2, 0, 0, 0)],
	])('should return the next run of the retention precision preset %s', (expression, expected) => {
		expect(getNextCronRunDate(expression, from)).toEqual(expected);
	});

	it('should accept day and month names', () => {
		expect(getNextCronRunDate('0 0 * * mon', from)).toEqual(new Date(2024, 5, 3, 0, 0, 0));
		expect(getNextCronRunDate('0 0 1 jul *', from)).toEqual(new Date(2024, 6, 1, 0, 0, 0));
	});

	it('should step day-of-month from the first day of the month', () => {
		expect(getNextCronRunDate('0 0 */2 * *', from)).toEqual(new Date(2024, 5, 3, 0, 0, 0));
	});

	it('should count months from zero', () => {
		expect(getNextCronRunDate('0 9 * 7 *', from)).toEqual(new Date(2024, 7, 1, 9, 0, 0));
	});

	it('should fire when either the day-of-month or the day-of-week matches', () => {
		expect(getNextCronRunDate('0 0 13 * fri', from)).toEqual(new Date(2024, 5, 7, 0, 0, 0));
	});

	it('should accept a seconds field', () => {
		expect(getNextCronRunDate('*/10 * * * * *', from)).toEqual(new Date(2024, 5, 1, 10, 15, 10));
	});

	it('should remap a day-of-month that no selected month has', () => {
		expect(getNextCronRunDate('0 0 30 feb *', from)).toEqual(new Date(2025, 1, 1, 0, 0, 0));
	});

	it('should return a date after the starting point when it already matches', () => {
		expect(getNextCronRunDate('15 10 * * *', from)).toEqual(new Date(2024, 5, 2, 10, 15, 0));
	});

	it.each<[timeZone: string, cases: [expression: string, from: string, expected: string][]]>([
		[
			'America/New_York',
			[
				// Spring forward: 2024-03-10 02:00 EST becomes 03:00 EDT.
				['0 * * * *', '2024-03-10T01:15:00-05:00', '2024-03-10T03:00:00-04:00'],
				['*/30 * * * *', '2024-03-10T01:45:00-05:00', '2024-03-10T03:00:00-04:00'],
				['0 */6 * * *', '2024-03-10T01:00:00-05:00', '2024-03-10T06:00:00-04:00'],
				['30 2 * * *', '2024-03-10T00:00:00-05:00', '2024-03-11T02:30:00-04:00'],
				['0 2 * * sun', '2024-03-09T12:00:00-05:00', '2024-03-17T02:00:00-04:00'],
				// Fall back: 2024-11-03 02:00 EDT becomes 01:00 EST, so 01:00-01:59 happens twice.
				['0 * * * *', '2024-11-03T01:15:00-04:00', '2024-11-03T02:00:00-05:00'],
				['0 * * * *', '2024-11-03T01:30:00-05:00', '2024-11-03T02:00:00-05:00'],
				['30 * * * *', '2024-11-03T01:00:00-05:00', '2024-11-03T01:30:00-05:00'],
				['30 1 * * *', '2024-11-03T00:00:00-04:00', '2024-11-03T01:30:00-04:00'],
				['30 1 * * *', '2024-11-03T01:45:00-04:00', '2024-11-04T01:30:00-05:00'],
				['0 23 * * *', '2024-11-02T23:30:00-04:00', '2024-11-03T23:00:00-05:00'],
			],
		],
		[
			'America/Havana',
			[
				// Spring forward at midnight: 2024-03-10 has no 00:00.
				['0 0 * * *', '2024-03-09T12:00:00-05:00', '2024-03-11T00:00:00-04:00'],
				['0 0 * * sun', '2024-03-08T12:00:00-05:00', '2024-03-17T00:00:00-04:00'],
				['0 * * * *', '2024-03-09T23:30:00-05:00', '2024-03-10T01:00:00-04:00'],
				// Fall back to midnight: 2024-11-03 01:00 CDT becomes 00:00 CST, so 00:00-00:59 happens twice.
				['30 0 * * *', '2024-11-02T12:00:00-04:00', '2024-11-03T00:30:00-04:00'],
				['30 0 * * *', '2024-11-03T00:00:00-05:00', '2024-11-03T00:30:00-05:00'],
				['0 * * * *', '2024-11-03T00:30:00-05:00', '2024-11-03T01:00:00-05:00'],
				['0 1 * * *', '2024-11-02T23:00:00-04:00', '2024-11-03T01:00:00-05:00'],
			],
		],
	])('should match the server across DST transitions in %s', (timeZone, cases) => {
		const results = getNextCronRunDatesIn(
			timeZone,
			cases.map(([expression, from]) => [expression, from]),
		);
		expect(results).toEqual(cases.map(([, , expected]) => new Date(expected).toISOString()));
	});

	it.each([
		['0 0 * * 7', 'Field (7) value is out of range'],
		['* * *', 'Too few fields'],
		['0 0 * * xyz', 'Unknown alias: xyz'],
		['0 */0 * * *', 'Field (0-23/0) has a step of zero'],
	])('should throw for the invalid expression %s', (expression, message) => {
		expect(() => getNextCronRunDate(expression, from)).toThrow(message);
	});
});
