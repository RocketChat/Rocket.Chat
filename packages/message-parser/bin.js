// @ts-check
import { parseArgs } from 'node:util'

import { parse } from './dist/index.js'

function main() {
	const [,, ...args] = process.argv;
	const parsedArgs = parseArgs({ args, strict: true, allowPositionals: true, options: {
		colors: { type: 'boolean', short: 'c', default: false, multiple: false },
		emoticons: { type: 'boolean', short: 'e', default: false, multiple: false },
		customDomains: { type: 'string', multiple: true, default: [] },
		katex: { type: 'string', short: 'k', default: '', multiple: false },


	} });

	const text = parsedArgs.positionals.join(' ');

	if (!text) {
		console.error('No text provided to parse');
		process.exit(1);
	}

	const result = parse(text, { colors: parsedArgs.values.colors, customDomains: parsedArgs.values.customDomains, emoticons: parsedArgs.values.emoticons, katex: parsedArgs.values.katex ? {
		dollarSyntax: parsedArgs.values.katex === 'dollar',
		parenthesisSyntax: parsedArgs.values.katex === 'parenthesis',
	} : undefined });

	console.log(JSON.stringify(result, null, 2));
}

main();