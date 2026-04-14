import { parse } from '../src';

const plain = (value: string) => ({ type: 'PLAIN_TEXT' as const, value });

const paragraph = (value: Array<Record<string, unknown>>) => ({ type: 'PARAGRAPH' as const, value });

const bold = (value: Array<Record<string, unknown>>) => ({ type: 'BOLD' as const, value });

const strike = (value: Array<Record<string, unknown>>) => ({ type: 'STRIKE' as const, value });

const timestampNode = (value: string, format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' = 't') => ({
	type: 'TIMESTAMP' as const,
	value: {
		timestamp: value,
		format,
	},
	fallback: plain(`<t:${value}:${format}>`),
});

test.each([
	[`<t:1708551317>`, [paragraph([timestampNode('1708551317')])]],
	[`<t:1708551317:R>`, [paragraph([timestampNode('1708551317', 'R')])]],
	['hello <t:1708551317>', [paragraph([plain('hello '), timestampNode('1708551317')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toMatchObject(output);
});

test.each([
	['<t:1708551317:I>', [paragraph([plain('<t:1708551317:I>')])]],
	['<t:17>', [paragraph([plain('<t:17>')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toMatchObject(output);
});

test.each([
	['~<t:1708551317>~', [paragraph([strike([timestampNode('1708551317')])])]],
	['*<t:1708551317>*', [paragraph([bold([plain('<t:1708551317>')])])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toMatchObject(output);
});

test.each([
	['<t:2025-07-22T10:00:00.000+00:00:R>', [paragraph([timestampNode('1753178400', 'R')])]],
	['<t:2025-07-22T10:00:00+00:00:R>', [paragraph([timestampNode('1753178400', 'R')])]],

	['<t:2025-07-24T20:19:58.154+00:00:R>', [paragraph([timestampNode('1753388398', 'R')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toMatchObject(output);
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
		['<t:10:00:00+00:00:R>', [paragraph([timestampNode('1753178400', 'R')])]],
		['<t:10:00+00:00:R>', [paragraph([timestampNode('1753178400', 'R')])]],
		['<t:10:00:05+00:00>', [paragraph([timestampNode('1753178405')])]],
		['<t:10:00+00:00>', [paragraph([timestampNode('1753178400')])]],
	])('parses %p', (input, output) => {
		expect(parse(input)).toMatchObject(output);
	});
});
