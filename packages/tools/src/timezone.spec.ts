import { canonicalizeTimezone, getTimezoneNames, getTimezoneOffsetHours, resolveDateAwareTimezone } from './timezone';

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

	it('resolves Windows and Canadian time zones', () => {
		expect(canonicalizeTimezone('Pacific Time (British Columbia)')).toBe('America/Vancouver');
		expect(canonicalizeTimezone('British Columbia Standard Time')).toBe('America/Vancouver');
		expect(canonicalizeTimezone('(UTC-07:00) Pacific Time (British Columbia)')).toBe('America/Vancouver');

		expect(canonicalizeTimezone('Mountain Time (Alberta)')).toBe('America/Edmonton');
		expect(canonicalizeTimezone('Alberta Standard Time')).toBe('America/Edmonton');
		expect(canonicalizeTimezone('(UTC-06:00) Mountain Time (Alberta)')).toBe('America/Edmonton');

		expect(canonicalizeTimezone('Manitoba')).toBe('America/Winnipeg');
		expect(canonicalizeTimezone('Central Time (Manitoba)')).toBe('America/Winnipeg');
		expect(canonicalizeTimezone('Manitoba Standard Time')).toBe('America/Winnipeg');
		expect(canonicalizeTimezone('(UTC-05:00) Central Time (Manitoba)')).toBe('America/Winnipeg');

		expect(canonicalizeTimezone('Yukon Standard Time')).toBe('America/Whitehorse');
		expect(canonicalizeTimezone('(UTC-07:00) Yukon')).toBe('America/Whitehorse');

		expect(canonicalizeTimezone('Canada Central Standard Time')).toBe('America/Regina');
		expect(canonicalizeTimezone('(UTC-06:00) Saskatchewan')).toBe('America/Regina');
	});

	it('guards against inherited prototype properties like constructor', () => {
		expect(canonicalizeTimezone('constructor')).toBe('constructor');
		expect(canonicalizeTimezone('toString')).toBe('toString');
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

describe('resolveDateAwareTimezone', () => {
	it('preserves historical seasonal zones before the November 2026 transition', () => {
		const winterPre = new Date('2026-01-15T19:00:00.000Z');
		expect(resolveDateAwareTimezone('Pacific Time (British Columbia)', winterPre)).toBe('America/Vancouver');
		expect(resolveDateAwareTimezone('America/Vancouver', winterPre)).toBe('America/Vancouver');

		expect(resolveDateAwareTimezone('Mountain Time (Alberta)', winterPre)).toBe('America/Edmonton');
		expect(resolveDateAwareTimezone('America/Edmonton', winterPre)).toBe('America/Edmonton');

		expect(resolveDateAwareTimezone('Central Time (Manitoba)', winterPre)).toBe('America/Winnipeg');
		expect(resolveDateAwareTimezone('America/Winnipeg', winterPre)).toBe('America/Winnipeg');
	});

	it('resolves to permanent zones on or after the November 2026 transition', () => {
		const winterPost = new Date('2026-12-15T19:00:00.000Z');
		expect(resolveDateAwareTimezone('Pacific Time (British Columbia)', winterPost)).toBe('America/Dawson_Creek');
		expect(resolveDateAwareTimezone('America/Vancouver', winterPost)).toBe('America/Dawson_Creek');

		expect(resolveDateAwareTimezone('Mountain Time (Alberta)', winterPost)).toBe('America/Regina');
		expect(resolveDateAwareTimezone('America/Edmonton', winterPost)).toBe('America/Regina');

		expect(resolveDateAwareTimezone('Central Time (Manitoba)', winterPost)).toBe('America/Atikokan');
		expect(resolveDateAwareTimezone('America/Winnipeg', winterPost)).toBe('America/Atikokan');
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

	it('resolves Canadian time zones with date-aware historical and permanent offsets', () => {
		const winterPre = new Date('2026-01-15T18:00:00.000Z');
		const summer = new Date('2026-07-15T18:00:00.000Z');
		const winterPost = new Date('2026-12-15T18:00:00.000Z');

		// British Columbia: winter pre = UTC-8, summer = UTC-7, winter post (permanent) = UTC-7
		expect(getTimezoneOffsetHours('Pacific Time (British Columbia)', winterPre)).toBe(-8);
		expect(getTimezoneOffsetHours('Pacific Time (British Columbia)', summer)).toBe(-7);
		expect(getTimezoneOffsetHours('Pacific Time (British Columbia)', winterPost)).toBe(-7);

		// Alberta: winter pre = UTC-7, summer = UTC-6, winter post (permanent) = UTC-6
		expect(getTimezoneOffsetHours('Mountain Time (Alberta)', winterPre)).toBe(-7);
		expect(getTimezoneOffsetHours('Mountain Time (Alberta)', summer)).toBe(-6);
		expect(getTimezoneOffsetHours('Mountain Time (Alberta)', winterPost)).toBe(-6);

		// Manitoba: winter pre = UTC-6, summer = UTC-5, winter post (permanent) = UTC-5
		expect(getTimezoneOffsetHours('Manitoba', winterPre)).toBe(-6);
		expect(getTimezoneOffsetHours('Manitoba', summer)).toBe(-5);
		expect(getTimezoneOffsetHours('Manitoba', winterPost)).toBe(-5);
	});

	it('parses fractional and historical offsets including seconds', () => {
		// Africa/Monrovia observed GMT-0:44:30 until 1972
		const historicalDate = new Date('1970-01-01T00:00:00.000Z');
		expect(getTimezoneOffsetHours('Africa/Monrovia', historicalDate)).toBeCloseTo(-0.7416666, 4);
	});
});
