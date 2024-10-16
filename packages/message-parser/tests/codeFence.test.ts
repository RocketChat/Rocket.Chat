import { parse } from '../src';
import { paragraph, plain, codeLine, code } from '../src/utils';

const multiply = <T>(a: number, element: T): Array<T> =>
  Array.from({ length: a }, () => element);

test.each([
  [
    `\`\`\`
code




code
\`\`\``,
    [
      code([
        codeLine(plain('code')),
        ...multiply(4, codeLine(plain(''))),
        codeLine(plain('code')),
      ]),
    ],
  ],
  [
    `\`\`\`
code


\`\`\``,
    [code([codeLine(plain('code')), ...multiply(2, codeLine(plain('')))])],
  ],
  [
    `\`\`\`
code
\`\`\``,
    [code([codeLine(plain('code'))])],
  ],
  [
    `\`\`\`
var a = "teste";
\`\`\``,
    [code([codeLine(plain('var a = "teste";'))])],
  ],
  [
    `\`\`\`javascript
code
\`\`\``,
    [code([codeLine(plain('code'))], 'javascript')],
  ],
  [
    `\`\`\`bash c
code
\`\`\``,
    [code([codeLine(plain('code'))], 'bash c')],
  ],
  [
    `  \`\`\`
code
\`\`\``,
    [
      paragraph([plain(`  \`\`\``)]),
      paragraph([plain(`code`)]),
      paragraph([plain(`\`\`\``)]),
    ],
  ],
  [
    `\`\`\`
code
code
\`\`\``,
    [code([codeLine(plain(`code`)), codeLine(plain(`code`))])],
  ],
  [
    `\`\`\`
# code
**code**
\`\`\``,
    [code([codeLine(plain(`# code`)), codeLine(plain(`**code**`))])],
  ],
])('parses %p', (input, output) => {
  expect(parse(input)).toMatchObject(output);
});
