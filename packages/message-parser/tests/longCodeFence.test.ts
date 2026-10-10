import { parse } from '../src';
import { code, codeLine, lineBreak, paragraph, plain } from './helpers';

test.each([
	[
		'````\nExample message with code block.\n\n```python\nprint("hello")\n```\n````',
		[
			code([
				codeLine(plain('Example message with code block.')),
				codeLine(plain('')),
				codeLine(plain('```python')),
				codeLine(plain('print("hello")')),
				codeLine(plain('```')),
			]),
		],
	],
	['````js\nconst a = 1;\n````', [code([codeLine(plain('const a = 1;'))], 'js')]],
	['`````\n````\ninner\n````\n`````', [code([codeLine(plain('````')), codeLine(plain('inner')), codeLine(plain('````'))])]],
	['````\nx\n````\nafter', [code([codeLine(plain('x'))]), lineBreak(), paragraph([plain('after')])]],
	['````\n````', [paragraph([plain('````')]), paragraph([plain('````')])]],
	['````\nunclosed\n```', [paragraph([plain('````')]), paragraph([plain('unclosed')]), paragraph([plain('```')])]],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
