import { parseMitelTimestamp, fixMitelTimestamp } from './parseMitelTimestamp';

jest.mock('../../logger', () => ({
	logger: {
		log: () => null,
		warn: () => null,
		error: () => null,
	},
}));

const invalidTimestamps = [
	'',
	// Missing Time
	'2026-04-14',
	// Under Minimum Length
	'2026-04-14 9:3',
	'null',
];

const timestamps = [
	{ raw: '2026-04-14 09:36:32 (UTC)', fixed: '2026-04-14 09:36:32Z' },
	{ raw: '2026-04-14 09:36:32 (Something Extra)', fixed: '2026-04-14 09:36:32Z' },
	{ raw: '2026-04-14 09:36:32 UTC', fixed: '2026-04-14 09:36:32 UTC' },
	{ raw: '2026-04-14T09:36:32Z', fixed: '2026-04-14T09:36:32Z' },
	{ raw: '2026-04-14T09:36:32-01:00', fixed: '2026-04-14T09:36:32-01:00' },
	{ raw: '2026-04-14T09:36:32+01:00', fixed: '2026-04-14T09:36:32+01:00' },
	{ raw: '2026-04-14T09:36', fixed: '2026-04-14T09:36Z' },
	{ raw: '2026-04-14T09:36-01:00', fixed: '2026-04-14T09:36-01:00' },
	{ raw: '2026-04-14T09:36+01:00', fixed: '2026-04-14T09:36+01:00' },
	{ raw: '2026-05-21T20:49:21.002Z', fixed: '2026-05-21T20:49:21.002Z' },
	{ raw: '2026-05-21T20:49:21.002-01:00', fixed: '2026-05-21T20:49:21.002-01:00' },
	{ raw: '2026-05-21T20:49:21.002+01:00', fixed: '2026-05-21T20:49:21.002+01:00' },
];

const parsed = new Date('2026-04-14T09:36:32Z');
const validTimestamps = [
	{ raw: '2026-04-14 09:36:32 (UTC)', parsed },
	{ raw: '2026-04-14 09:36:32 (Something Extra)', parsed },
	{ raw: '2026-04-14 09:36:32 UTC', parsed },
	{ raw: '2026-04-14T09:36:32Z', parsed },
	{ raw: '2026-04-14T09:36:32-01:00', parsed: new Date('2026-04-14T09:36:32-01:00') },
];

const nullTimestamps = [
	'',
	'2026-04-14',
	// unix timestamps aren't parsed from strings
	'1776159392000',
	// non-strings are rejected by the function
	1776159392000,
	// Even if it were parsed, this value would not be a valid date
	'17793859066180000',
	17793859066180000,
	'2026-04-14 09:36:32 Something Extra',
];

describe('fixMitelTimestamp', () => {
	it.each(invalidTimestamps)('should throw while fixing %i', (raw) => {
		expect(() => fixMitelTimestamp(raw)).toThrow();
	});

	it.each(timestamps)('should fix $raw to $fixed', ({ raw, fixed }) => {
		expect(fixMitelTimestamp(raw)).toEqual(fixed);
	});
});

describe('parseMitelTimestamp', () => {
	it.each(nullTimestamps)('should parse %i to null', (raw) => {
		expect(parseMitelTimestamp(raw)).toBeNull();
	});

	it.each(validTimestamps)('should parse $raw to $parsed', ({ raw, parsed }) => {
		expect(parseMitelTimestamp(raw)).toEqual(parsed);
	});
});
