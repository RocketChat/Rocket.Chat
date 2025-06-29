import { relativeTime } from './relativeTime';

describe('relativeTime', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should format seconds ago correctly', () => {
		jest.setSystemTime(new Date('2023-01-01T12:00:30Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 30 seconds ago
		expect(relativeTime(date, 'en-US')).toBe('30 seconds ago');
	});

	it('should format minutes ago correctly', () => {
		jest.setSystemTime(new Date('2023-01-01T12:05:00Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 5 minutes ago
		expect(relativeTime(date, 'en-US')).toBe('5 minutes ago');
	});

	it('should format hours ago correctly', () => {
		jest.setSystemTime(new Date('2023-01-01T15:00:00Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 3 hours ago
		expect(relativeTime(date, 'en-US')).toBe('3 hours ago');
	});

	it('should format days ago correctly', () => {
		jest.setSystemTime(new Date('2023-01-05T12:00:00Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 4 days ago
		expect(relativeTime(date, 'en-US')).toBe('4 days ago');
	});

	it('should format weeks ago correctly', () => {
		jest.setSystemTime(new Date('2023-01-22T12:00:00Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 3 weeks ago
		expect(relativeTime(date, 'en-US')).toBe('3 weeks ago');
	});

	it('should format months ago correctly', () => {
		jest.setSystemTime(new Date('2023-05-01T12:00:00Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 4 months ago
		expect(relativeTime(date, 'en-US')).toBe('4 months ago');
	});

	it('should format years ago correctly', () => {
		jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 2 years ago
		expect(relativeTime(date, 'en-US')).toBe('2 years ago');
	});

	it('should format future dates correctly', () => {
		jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
		const date = new Date('2023-05-01T12:00:00Z'); // 4 months in the future
		expect(relativeTime(date, 'en-US')).toBe('in 4 months');
	});

	it('should handle date strings', () => {
		jest.setSystemTime(new Date('2023-01-02T12:00:00Z'));
		expect(relativeTime('2023-01-01T12:00:00Z', 'en-US')).toBe('1 day ago');
	});

	it('should handle timestamps', () => {
		jest.setSystemTime(new Date('2023-01-02T12:00:00Z'));
		const timestamp = new Date('2023-01-01T12:00:00Z').getTime();
		expect(relativeTime(timestamp, 'en-US')).toBe('1 day ago');
	});

	it('should handle invalid dates', () => {
		expect(relativeTime('not-a-date', 'en-US')).toBe('');
	});

	it('should respect the provided locale', () => {
		jest.setSystemTime(new Date('2023-01-02T12:00:00Z'));
		const date = new Date('2023-01-01T12:00:00Z'); // 1 day ago
		expect(relativeTime(date, 'pt-BR')).toContain('dia'); // Portuguese for "day"
	});

	// Edge case: Month calculation at year boundaries
	it('should correctly calculate months across year boundaries', () => {
		jest.setSystemTime(new Date('2023-01-15T12:00:00Z'));
		const date = new Date('2022-12-15T12:00:00Z'); // 1 month ago, across year boundary
		expect(relativeTime(date, 'en-US')).toBe('1 month ago');
	});

	it('should correctly calculate months when going from December to January', () => {
		jest.setSystemTime(new Date('2023-01-15T12:00:00Z'));
		const date = new Date('2022-12-15T12:00:00Z'); // December to January (1 month)
		expect(relativeTime(date, 'en-US')).toBe('1 month ago');
	});

	it('should correctly calculate months when going from January to December', () => {
		jest.setSystemTime(new Date('2022-12-15T12:00:00Z'));
		const date = new Date('2023-01-15T12:00:00Z'); // January to December (1 month in future)
		expect(relativeTime(date, 'en-US')).toBe('in 1 month');
	});

	describe('with invalid dates', () => {
		it('should return empty string by default for invalid dates', () => {
			expect(relativeTime('not-a-date', 'en-US')).toBe('');
		});

		it('should return custom fallback value when provided for invalid dates', () => {
			expect(relativeTime('not-a-date', 'en-US', 'Invalid date')).toBe('Invalid date');
		});
	});
});
