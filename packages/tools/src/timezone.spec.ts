import { canonicalizeTimezone, getTimezoneNames } from './timezone';

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
