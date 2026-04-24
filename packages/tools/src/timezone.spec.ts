import { canonicalizeTimezone } from './timezone';

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

	it('returns the input unchanged when it is not a recognized zone', () => {
		const input = 'Not/A_Zone';
		expect(canonicalizeTimezone(input)).toBe(input);
	});
});
