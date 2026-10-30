import { lineBreak, paragraph, plain } from './helpers.js';
import { parse } from '../src/index.js';

test.each([
	[
		`test

test2`,
		[paragraph([plain('test')]), lineBreak(), paragraph([plain('test2')])],
	],
	[
		`test

test2
`,
		[paragraph([plain('test')]), lineBreak(), paragraph([plain('test2')])],
	],
	[
		`test



test2
`,
		[paragraph([plain('test')]), lineBreak(), lineBreak(), lineBreak(), paragraph([plain('test2')])],
	],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
