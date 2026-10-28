import { getNextCronRunDate } from './getNextCronRunDate';

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

	it.each([
		['0 0 * * 7', 'Field (7) value is out of range'],
		['* * *', 'Too few fields'],
		['0 0 * * xyz', 'Unknown alias: xyz'],
		['0 */0 * * *', 'Field (0-23/0) has a step of zero'],
	])('should throw for the invalid expression %s', (expression, message) => {
		expect(() => getNextCronRunDate(expression, from)).toThrow(message);
	});
});
