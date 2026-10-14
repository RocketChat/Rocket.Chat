import { canonicalizeTimezone, getTimezoneNames, getTimezoneOffsetHours } from './timezone';

describe('canonicalizeTimezone', () => {
	it('returns the same value for a canonical IANA zone', () => {
		expect(canonicalizeTimezone('America/Sao_Paulo')).toBe('America/Sao_Paulo');
	});

	it('resolves plain UTC to UTC', () => {
		expect(canonicalizeTimezone('UTC')).toBe('UTC');
	});

	it('resolves Etc/UTC and Etc/GMT to UTC', () => {
		expect(canonicalizeTimezone('Etc/UTC')).toBe('UTC');
		expect(canonicalizeTimezone('Etc/GMT')).toBe('UTC');
	});

	it('resolves legacy moment aliases to their canonical zone', () => {
		expect(canonicalizeTimezone('GMT')).toBe('UTC');
		expect(canonicalizeTimezone('Zulu')).toBe('UTC');
		expect(canonicalizeTimezone('Universal')).toBe('UTC');
		expect(canonicalizeTimezone('US/Pacific')).toBe('America/Los_Angeles');
		expect(canonicalizeTimezone('Japan')).toBe('Asia/Tokyo');
	});

	it('resolves legacy IANA names to modern canonical names', () => {
		expect(canonicalizeTimezone('Asia/Calcutta')).toBe('Asia/Kolkata');
		expect(canonicalizeTimezone('Asia/Katmandu')).toBe('Asia/Kathmandu');
		expect(canonicalizeTimezone('Asia/Rangoon')).toBe('Asia/Yangon');
		expect(canonicalizeTimezone('Asia/Saigon')).toBe('Asia/Ho_Chi_Minh');
		expect(canonicalizeTimezone('Europe/Kiev')).toBe('Europe/Kyiv');
		expect(canonicalizeTimezone('America/Godthab')).toBe('America/Nuuk');
		expect(canonicalizeTimezone('Pacific/Enderbury')).toBe('Pacific/Kanton');
	});

	it('resolves Windows and Canadian permanent time zones', () => {
		expect(canonicalizeTimezone('Pacific Time (British Columbia)')).toBe('America/Dawson_Creek');
		expect(canonicalizeTimezone('British Columbia Standard Time')).toBe('America/Dawson_Creek');
		expect(canonicalizeTimezone('(UTC-07:00) Pacific Time (British Columbia)')).toBe('America/Dawson_Creek');

		expect(canonicalizeTimezone('Mountain Time (Alberta)')).toBe('America/Regina');
		expect(canonicalizeTimezone('Alberta Standard Time')).toBe('America/Regina');
		expect(canonicalizeTimezone('(UTC-06:00) Mountain Time (Alberta)')).toBe('America/Regina');

		expect(canonicalizeTimezone('Manitoba')).toBe('America/Atikokan');
		expect(canonicalizeTimezone('Central Time (Manitoba)')).toBe('America/Atikokan');
		expect(canonicalizeTimezone('Manitoba Standard Time')).toBe('America/Atikokan');

		expect(canonicalizeTimezone('Yukon Standard Time')).toBe('America/Whitehorse');
	});

	it('preserves modern canonical names as-is', () => {
		expect(canonicalizeTimezone('Asia/Kolkata')).toBe('Asia/Kolkata');
		expect(canonicalizeTimezone('Europe/Kyiv')).toBe('Europe/Kyiv');
		expect(canonicalizeTimezone('Asia/Ho_Chi_Minh')).toBe('Asia/Ho_Chi_Minh');
	});

	it('returns the input unchanged when it is not a recognized zone', () => {
		const input = 'Not/A_Zone';
		expect(canonicalizeTimezone(input)).toBe(input);
	});
});

describe('getTimezoneNames', () => {
	it('returns modern canonical names instead of legacy ones', () => {
		const names = getTimezoneNames();
		expect(names).toContain('Asia/Kolkata');
		expect(names).not.toContain('Asia/Calcutta');
		expect(names).toContain('Europe/Kyiv');
		expect(names).not.toContain('Europe/Kiev');
		expect(names).toContain('Asia/Yangon');
		expect(names).not.toContain('Asia/Rangoon');
	});
});

describe('getTimezoneOffsetHours', () => {
	it('calculates the correct UTC offset in hours', () => {
		expect(getTimezoneOffsetHours('America/Dawson_Creek')).toBe(-7);
		expect(getTimezoneOffsetHours('America/Regina')).toBe(-6);
		expect(getTimezoneOffsetHours('America/Atikokan')).toBe(-5);
		expect(getTimezoneOffsetHours('UTC')).toBe(0);
	});

	it('resolves Windows Canadian time zones to accurate offsets', () => {
		expect(getTimezoneOffsetHours('Pacific Time (British Columbia)')).toBe(-7);
		expect(getTimezoneOffsetHours('Mountain Time (Alberta)')).toBe(-6);
		expect(getTimezoneOffsetHours('Manitoba')).toBe(-5);
	});
});

