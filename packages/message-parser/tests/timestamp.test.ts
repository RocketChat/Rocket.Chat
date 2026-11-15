import { parse } from '../src';

const plain = (value: string) => ({ type: 'PLAIN_TEXT' as const, value });

const paragraph = (value: Array<Record<string, unknown>>) => ({ type: 'PARAGRAPH' as const, value });

const bold = (value: Array<Record<string, unknown>>) => ({ type: 'BOLD' as const, value });

const strike = (value: Array<Record<string, unknown>>) => ({ type: 'STRIKE' as const, value });

// `fallback` is the [start, end] offset span of the raw `<t:...>` in the source.
const timestampNode = (value: string, format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' = 't', fallback?: [number, number]) => ({
	type: 'TIMESTAMP' as const,
	value: {
		timestamp: value,
		format,
	},
	...(fallback !== undefined ? { fallback } : {}),
});

const spanOf = (input: string, raw: string): [number, number] => {
	const start = input.indexOf(raw);
	return [start, start + raw.length];
};

test.each([
	['<t:1708551317>', '<t:1708551317>', '1708551317', 't' as const],
	['<t:1708551317:R>', '<t:1708551317:R>', '1708551317', 'R' as const],
	['hello <t:1708551317>', '<t:1708551317>', '1708551317', 't' as const],
])('parses %p', (input, raw, value, format) => {
	const node = timestampNode(value, format, spanOf(input, raw));
	const prefix = input.slice(0, input.indexOf(raw));
	expect(parse(input)).toEqual([paragraph(prefix ? [plain(prefix), node] : [node])]);
});

test.each([
	['<t:1708551317:I>', [paragraph([plain('<t:1708551317:I>')])]],
	['<t:17>', [paragraph([plain('<t:17>')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});

test.each([
	['~<t:1708551317>~', '<t:1708551317>', '1708551317', 't' as const, strike],
	['~<t:1708551317:R>~', '<t:1708551317:R>', '1708551317', 'R' as const, strike],
	['*<t:1708551317>*', '<t:1708551317>', '1708551317', 't' as const, bold],
])('parses %p', (input, raw, value, format, wrapper) => {
	const node = timestampNode(value, format, spanOf(input, raw));
	expect(parse(input)).toEqual([paragraph([wrapper([node])])]);
});

test.each([
	['<t:2025-07-22T10:00:00.000+00:00:R>', '1753178400', 'R' as const],
	['<t:2025-07-22T10:00:00+00:00:R>', '1753178400', 'R' as const],
	['<t:2025-07-24T20:19:58.154+00:00:R>', '1753388398', 'R' as const],
])('parses %p', (input, value, format) => {
	const node = timestampNode(value, format, [0, input.length]);
	expect(parse(input)).toEqual([paragraph([node])]);
});

describe('relative hour timestamp parsing', () => {
	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-07-22T00:00:00.000Z'));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	test.each([
		['<t:10:00:00+00:00:R>', '1753178400', 'R' as const],
		['<t:10:00+00:00:R>', '1753178400', 'R' as const],
		['<t:10:00:05+00:00>', '1753178405', 't' as const],
		['<t:10:00+00:00>', '1753178400', 't' as const],
	])('parses %p', (input, value, format) => {
		const node = timestampNode(value, format, [0, input.length]);
		expect(parse(input)).toEqual([paragraph([node])]);
	});
});
