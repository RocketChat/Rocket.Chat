import { parse } from '../src';
import { inlineKatex, katex, paragraph, plain } from './helpers';

test.each([
	[
		`\\[
      \\f\\relax{x} = \\int_{-\\infty}^\\infty
      \\f\\hat\\xi\\,e^{2 \\pi i \\xi x}
      \\,d\\xi
    \\]`,
		[
			katex(`
      \\f\\relax{x} = \\int_{-\\infty}^\\infty
      \\f\\hat\\xi\\,e^{2 \\pi i \\xi x}
      \\,d\\xi
    `),
		],
	],
	['Easy as \\(E = mc^2\\), right?', [paragraph([plain('Easy as '), inlineKatex('E = mc^2'), plain(', right?')])]],
])('parses %p', (input, output) => {
	expect(parse(input, { katex: { parenthesisSyntax: true } })).toMatchObject(output);
});

test.each([
	['$$E = mc^2$$', [katex('E = mc^2')]],
	['$E = mc^2$', [paragraph([inlineKatex('E = mc^2')])]],
	['Easy as $E = mc^2$, right?', [paragraph([plain('Easy as '), inlineKatex('E = mc^2'), plain(', right?')])]],
	['$$\n\\sum_{i=1}^{n} x_i\n$$', [katex('\n\\sum_{i=1}^{n} x_i\n')]],
	['$$\\frac{a}{b} + \\sqrt{c}$$', [katex('\\frac{a}{b} + \\sqrt{c}')]],
	['$a$ text $b$', [paragraph([inlineKatex('a'), plain(' text '), inlineKatex('b')])]],
	['$x$ and $y$', [paragraph([inlineKatex('x'), plain(' and '), inlineKatex('y')])]],
])('parses %p', (input, output) => {
	expect(parse(input, { katex: { dollarSyntax: true } })).toMatchObject(output);
});

test.each([
	['$$E = mc^2$$', [paragraph([plain('$$E = mc^2$$')])]],
	['$E = mc^2$', [paragraph([plain('$E = mc^2$')])]],
	['\\(E = mc^2\\)', [paragraph([plain('\\(E = mc^2\\)')])]],
])('parses KaTeX as plain text when syntax options are disabled: %p', (input, output) => {
	expect(parse(input)).toMatchObject(output);
});
