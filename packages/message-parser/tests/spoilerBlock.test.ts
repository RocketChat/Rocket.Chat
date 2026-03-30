import { parse } from '../src';
import { lineBreak, paragraph, plain, spoilerBlock } from './helpers';

describe('block spoiler parsing', () => {
	test.each([
		[
			`||
line one
||`,
			[spoilerBlock([paragraph([plain('line one')])])],
		],
		[
			`||
line one
line two
||`,
			[spoilerBlock([paragraph([plain('line one')]), paragraph([plain('line two')])])],
		],
		[
			`before
||
hidden
||
after`,
			[paragraph([plain('before')]), spoilerBlock([paragraph([plain('hidden')])]), lineBreak(), paragraph([plain('after')])],
		],
	])('parses block spoilers: %p', (input, output) => {
		expect(parse(input)).toMatchObject(output);
	});
});
