import { getClosedPeriod } from './periods';

jest.mock('moment', () => {
	return () => jest.requireActual('moment')('2024-05-19T12:00:00.000Z');
});

it('should return the correct period range for this month', () => {
	const monthExpectedReturn = {
		start: new Date('5/1/2024').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('month')(true).start.toISOString().split('T')[0]).toEqual(monthExpectedReturn.start);
	expect(getClosedPeriod('month')(true).end.toISOString().split('T')[0]).toEqual(monthExpectedReturn.end);
});

it('should return the correct period range for this year', () => {
	const yearExpectedReturn = {
		start: new Date('1/1/2024').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('year')(true).start.toISOString().split('T')[0]).toEqual(yearExpectedReturn.start);
	expect(getClosedPeriod('year')(true).end.toISOString().split('T')[0]).toEqual(yearExpectedReturn.end);
});

it('should return the correct period range for last 6 months', () => {
	const last6MonthsExpectedReturn = {
		start: new Date('11/1/2023').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('month', 6)(true).start.toISOString().split('T')[0]).toEqual(last6MonthsExpectedReturn.start);
	expect(getClosedPeriod('month', 6)(true).end.toISOString().split('T')[0]).toEqual(last6MonthsExpectedReturn.end);
});

it('should return the correct period range for this week', () => {
	const weekExpectedReturn = {
		start: new Date('5/19/2024').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('week')(true).start.toISOString().split('T')[0]).toEqual(weekExpectedReturn.start);
	expect(getClosedPeriod('week')(true).end.toISOString().split('T')[0]).toEqual(weekExpectedReturn.end);
});

it('should return the correct period range for this month using local time', () => {
	const monthExpectedReturn = {
		start: new Date('5/1/2024').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('month')(false).start.toISOString().split('T')[0]).toEqual(monthExpectedReturn.start);
	expect(getClosedPeriod('month')(false).end.toISOString().split('T')[0]).toEqual(monthExpectedReturn.end);
});

it('should return the correct period range for this year using local time', () => {
	const yearExpectedReturn = {
		start: new Date('1/1/2024').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('year')(false).start.toISOString().split('T')[0]).toEqual(yearExpectedReturn.start);
	expect(getClosedPeriod('year')(false).end.toISOString().split('T')[0]).toEqual(yearExpectedReturn.end);
});

it('should return the correct period range for last 6 months using local time', () => {
	const last6MonthsExpectedReturn = {
		start: new Date('11/1/2023').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('month', 6)(false).start.toISOString().split('T')[0]).toEqual(last6MonthsExpectedReturn.start);
	expect(getClosedPeriod('month', 6)(false).end.toISOString().split('T')[0]).toEqual(last6MonthsExpectedReturn.end);
});

it('should return the correct period range for this week using local time', () => {
	const weekExpectedReturn = {
		start: new Date('5/19/2024').toISOString().split('T')[0],
		end: new Date('5/19/2024').toISOString().split('T')[0],
	};

	expect(getClosedPeriod('week')(false).start.toISOString().split('T')[0]).toEqual(weekExpectedReturn.start);
	expect(getClosedPeriod('week')(false).end.toISOString().split('T')[0]).toEqual(weekExpectedReturn.end);
});
