import { getClosedPeriod } from './periods';

jest.useFakeTimers();
jest.setSystemTime(Date.parse('2024-05-19T12:00:00.000Z'));

it('should return the correct period range for this month', () => {
	const period = getClosedPeriod({ startOf: 'month' })(true);

	expect(period.start).toEqual(new Date('2024-05-01T00:00:00.000Z'));
	expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999Z'));
});

it('should return the correct period range for this year', () => {
	const period = getClosedPeriod({ startOf: 'year' })(true);

	expect(period.start).toEqual(new Date('2024-01-01T00:00:00.000Z'));
	expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999Z'));
});

it('should return the correct period range for last 6 months', () => {
	const period = getClosedPeriod({ startOf: 'month', subtract: { amount: 6, unit: 'months' } })(true);

	expect(period.start).toEqual(new Date('2023-11-01T00:00:00.000Z'));
	expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999Z'));
});

it('should return the correct period range for this week', () => {
	const period = getClosedPeriod({ startOf: 'week' })(true);

	expect(period.start).toEqual(new Date('2024-05-19T00:00:00.000Z'));
	expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999Z'));
});

describe('using local time', () => {
	it('should return the correct period range for this month', () => {
		const period = getClosedPeriod({ startOf: 'month' })(false);

		expect(period.start).toEqual(new Date('2024-05-01T00:00:00.000'));
		expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999'));
	});

	it('should return the correct period range for this year', () => {
		const period = getClosedPeriod({ startOf: 'year' })(false);

		expect(period.start).toEqual(new Date('2024-01-01T00:00:00.000'));
		expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999'));
	});

	it('should return the correct period range for last 6 months', () => {
		const period = getClosedPeriod({ startOf: 'month', subtract: { amount: 6, unit: 'months' } })(false);

		expect(period.start).toEqual(new Date('2023-11-01T00:00:00.000'));
		expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999'));
	});

	it('should return the correct period range for this week', () => {
		const period = getClosedPeriod({ startOf: 'week' })(false);

		expect(period.start).toEqual(new Date('2024-05-19T00:00:00.000'));
		expect(period.end).toEqual(new Date('2024-05-19T23:59:59.999'));
	});
});
