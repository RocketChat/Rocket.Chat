import { parseMitelDuration } from './parseMitelDuration';

const durations = [
	{ raw: '00:00:00', parsed: 0 },
	{ raw: '00:00:01', parsed: 1 },
	{ raw: '00:00:45', parsed: 45 },
	{ raw: '00:01:00', parsed: 60 },
	{ raw: '00:01:45', parsed: 105 },
	{ raw: '00:03:45', parsed: 225 },
	{ raw: '01:03:45', parsed: 3825 },
	{ raw: '99:99:99', parsed: 362439 },
	{ raw: '10:01:01:01', parsed: 3661 },
	{ raw: '01', parsed: 1 },
	{ raw: '01:01', parsed: 61 },
	{ raw: '1', parsed: 1 },
	{ raw: '1:1', parsed: 61 },
	{ raw: '100:100:100', parsed: 366100 },
	{ raw: 'a', parsed: 0 },
	{ raw: '01:01:xy', parsed: 3660 },
	{ raw: '01:xy:01', parsed: 3601 },
	{ raw: 'xy:01:01', parsed: 61 },
	{ raw: 'xy:01:03:45', parsed: 3825 },
	{ raw: '', parsed: 0 },
	{ raw: 'xyz', parsed: 0 },
	{ raw: 'null:01', parsed: 1 },
	{ raw: 'null', parsed: 0 },
	{ raw: '01:01:', parsed: 3660 },
	{ raw: '01::01', parsed: 3601 },
	{ raw: ':01:01', parsed: 61 },
	{ raw: ':01:03:45', parsed: 3825 },
	{ raw: '1a', parsed: 1 },
	{ raw: '01:01:1a', parsed: 3661 },
	{ raw: '01:1a:01', parsed: 3661 },
	{ raw: '1a:01:01', parsed: 3661 },
	{ raw: '0a:01:03:45', parsed: 3825 },
	{ raw: false, parsed: 0 },
	{ raw: null, parsed: 0 },
	{ raw: undefined, parsed: 0 },
	{ raw: 20, parsed: 20 },
	{ raw: {}, parsed: 0 },
	{ raw: [], parsed: 0 },
	{ raw: new Date(), parsed: 0 },
];

describe('parseMitelDuration', () => {
	it.each(durations)('should parse $raw to $parsed', ({ raw, parsed }) => {
		expect(parseMitelDuration(raw)).toEqual(parsed);
	});
});
