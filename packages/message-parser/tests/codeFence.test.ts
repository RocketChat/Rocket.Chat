import { parse } from '../src';
import { paragraph, plain, codeLine, code } from './helpers';

const multiply = <T>(a: number, element: T): Array<T> => Array.from({ length: a }, () => element);

test.each([
	[
		`\`\`\`
code




code
\`\`\``,
		[code([codeLine(plain('code')), ...multiply(4, codeLine(plain(''))), codeLine(plain('code'))])],
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
		[paragraph([plain(`  \`\`\``)]), paragraph([plain(`code`)]), paragraph([plain(`\`\`\``)])],
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
	// lines ending in inline code (trailing backtick) must not break the fence
	[
		`\`\`\`
- **Node**: \`22.22.3\`
- **Apps-Engine**: \`1.64.0\`
\`\`\``,
		[code([codeLine(plain('- **Node**: `22.22.3`')), codeLine(plain('- **Apps-Engine**: `1.64.0`'))])],
	],
	[
		`\`\`\`
foo\`
\`\`\``,
		[code([codeLine(plain('foo`'))])],
	],
	[
		`\`\`\`
foo\`\`
\`\`\``,
		[code([codeLine(plain('foo``'))])],
	],
])('parses %p', (input, output) => {
	expect(parse(input)).toEqual(output);
});
