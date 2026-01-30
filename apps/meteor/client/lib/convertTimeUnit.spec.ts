import { TIMEUNIT, timeUnitToMs, msToTimeUnit } from './convertTimeUnit';

describe('timeUnitToMs function', () => {
	it('should correctly convert days to milliseconds', () => {
		expect(timeUnitToMs(TIMEUNIT.days, 1)).toBe(86400000);
		expect(timeUnitToMs(TIMEUNIT.days, 2)).toBe(172800000);
		expect(timeUnitToMs(TIMEUNIT.days, 0.5)).toBe(43200000);
	});

	it('should correctly convert hours to milliseconds', () => {
		expect(timeUnitToMs(TIMEUNIT.hours, 1)).toBe(3600000);
		expect(timeUnitToMs(TIMEUNIT.hours, 2)).toBe(7200000);
		expect(timeUnitToMs(TIMEUNIT.hours, 0.5)).toBe(1800000);
	});

	it('should correctly convert minutes to milliseconds', () => {
		expect(timeUnitToMs(TIMEUNIT.minutes, 1)).toBe(60000);
		expect(timeUnitToMs(TIMEUNIT.minutes, 2)).toBe(120000);
		expect(timeUnitToMs(TIMEUNIT.minutes, 0.5)).toBe(30000);
	});

	it('should throw an error for invalid time units', () => {
		expect(() => timeUnitToMs('invalidUnit' as TIMEUNIT, 1)).toThrow('timeUnitToMs - invalid time unit');
	});

	it('should throw an error for invalid timespan', () => {
		const errorMessage = 'timeUnitToMs - invalid timespan';
		expect(() => timeUnitToMs(TIMEUNIT.days, NaN)).toThrow(errorMessage);
		expect(() => timeUnitToMs(TIMEUNIT.days, Infinity)).toThrow(errorMessage);
		expect(() => timeUnitToMs(TIMEUNIT.days, -Infinity)).toThrow(errorMessage);
		expect(() => timeUnitToMs(TIMEUNIT.days, -1)).toThrow(errorMessage);
	});
});

describe('msToTimeUnit function', () => {
	it('should correctly convert milliseconds to days', () => {
		expect(msToTimeUnit(TIMEUNIT.days, 86400000)).toBe(1); // 1 day
		expect(msToTimeUnit(TIMEUNIT.days, 172800000)).toBe(2); // 2 days
		expect(msToTimeUnit(TIMEUNIT.days, 43200000)).toBe(0.5); // .5 days
	});

	it('should correctly convert milliseconds to hours', () => {
		expect(msToTimeUnit(TIMEUNIT.hours, 3600000)).toBe(1); // 1 hour
		expect(msToTimeUnit(TIMEUNIT.hours, 7200000)).toBe(2); // 2 hours
		expect(msToTimeUnit(TIMEUNIT.hours, 1800000)).toBe(0.5); // .5 hours
	});

	it('should correctly convert milliseconds to minutes', () => {
		expect(msToTimeUnit(TIMEUNIT.minutes, 60000)).toBe(1); // 1 min
		expect(msToTimeUnit(TIMEUNIT.minutes, 120000)).toBe(2); // 2 min
		expect(msToTimeUnit(TIMEUNIT.minutes, 30000)).toBe(0.5); // .5 min
	});

	it('should throw an error for invalid time units', () => {
		expect(() => msToTimeUnit('invalidUnit' as TIMEUNIT, 1)).toThrow('msToTimeUnit - invalid time unit');
	});

	it('should throw an error for invalid timespan', () => {
		const errorMessage = 'msToTimeUnit - invalid timespan';
		expect(() => msToTimeUnit(TIMEUNIT.days, NaN)).toThrow(errorMessage);
		expect(() => msToTimeUnit(TIMEUNIT.days, Infinity)).toThrow(errorMessage);
		expect(() => msToTimeUnit(TIMEUNIT.days, -Infinity)).toThrow(errorMessage);
		expect(() => msToTimeUnit(TIMEUNIT.days, -1)).toThrow(errorMessage);
	});
});
