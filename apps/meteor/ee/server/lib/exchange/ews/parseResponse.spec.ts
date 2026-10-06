import { parseEwsDateTime } from './parseResponse';

describe('parseEwsDateTime', () => {
	it('parses the EWS UTC format', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00Z')?.toISOString()).toBe('2026-08-21T10:00:00.000Z');
	});

	it('respects an explicit offset when one is present', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00+02:00')?.toISOString()).toBe('2026-08-21T08:00:00.000Z');
	});

	it('takes an offset written without a colon, which Exchange also sends', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00+0200')?.toISOString()).toBe('2026-08-21T08:00:00.000Z');
	});

	/**
	 * a host already on UTC cannot tell the two readings apart. The suite pins `TZ=UTC`, so this documents
	 * the contract and catches the regression for whoever runs the file without that wrapper.
	 */
	it('reads a value with no zone as UTC, which is what the request asked for', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00')?.toISOString()).toBe('2026-08-21T10:00:00.000Z');
	});

	it.each([
		['junk', 'nonsense'],
		['an empty string', ''],
		['nothing at all', undefined],
	])('returns undefined rather than epoch for %s', (_case, value) => {
		expect(parseEwsDateTime(value)).toBeUndefined();
	});
});
