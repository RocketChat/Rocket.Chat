import { parse } from '../src';
import { inlineKatex, katex, paragraph, plain } from './helpers';

describe('KaTeX Parsing', () => {
  describe('parenthesisSyntax', () => {
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
      [
        `\\[ E = mc^2 \\]`,
        [paragraph([plain('\\[ E = mc^2 \\]')])], // Treated as plain text when disabled
      ],
      ['\\(E = mc^2\\)', [paragraph([plain('\\(E = mc^2\\)')])]], // Treated as plain text when disabled
    ])('evaluates as plain text when parenthesisSyntax is disabled: %p', (input, output) => {
      expect(parse(input, { katex: { parenthesisSyntax: false } })).toMatchObject(output);
    });
  });

  describe('dollarSyntax', () => {
    test.each([
      [
        `$$
      \\f\\relax{x} = \\int_{-\\infty}^\\infty
      \\f\\hat\\xi\\,e^{2 \\pi i \\xi x}
      \\,d\\xi
    $$`,
        [
          katex(`
      \\f\\relax{x} = \\int_{-\\infty}^\\infty
      \\f\\hat\\xi\\,e^{2 \\pi i \\xi x}
      \\,d\\xi
    `),
        ],
      ],
      ['Easy as $E = mc^2$, right?', [paragraph([plain('Easy as '), inlineKatex('E = mc^2'), plain(', right?')])]],
    ])('parses %p', (input, output) => {
      expect(parse(input, { katex: { dollarSyntax: true } })).toMatchObject(output);
    });

    test.each([
      [
        `$$ E = mc^2 $$`,
        [paragraph([plain('$$ E = mc^2 $$')])], // Treated as plain text when disabled
      ],
      ['$E = mc^2$', [paragraph([plain('$E = mc^2$')])]], // Treated as plain text when disabled
    ])('evaluates as plain text when dollarSyntax is disabled: %p', (input, output) => {
      expect(parse(input, { katex: { dollarSyntax: false } })).toMatchObject(output);
    });
  });
});
