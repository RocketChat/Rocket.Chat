import { parse } from '../src';
import { inlineKatex, katex, paragraph, plain } from '../src/utils';

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
  [
    'Easy as \\(E = mc^2\\), right?',
    [
      paragraph([
        plain('Easy as '),
        inlineKatex('E = mc^2'),
        plain(', right?'),
      ]),
    ],
  ],
])('parses %p', (input, output) => {
  expect(parse(input, { katex: { parenthesisSyntax: true } })).toMatchObject(
    output
  );
});
