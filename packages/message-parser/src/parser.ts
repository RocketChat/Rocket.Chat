import { Options, Root } from './index';
import { lineBreak, paragraph, plain } from './utils';

export const parse = (input: string, options?: Options) => {
	const root: Root = [];
	let i = 0;

	while (i < input.length) {
		const start = i;
		while (i < input.length && input[i] !== '\n' && input[i] !== '\r') {
			i++;
		}

		const text = input.slice(start, i);
		const isLastPosition = i >= input.length;

		if (text === '') {
			if (!isLastPosition) root.push(lineBreak());
		} else {
			root.push(paragraph([plain(text)]));
		}

		if (i < input.length) {
			if (input[i] === '\n' && input[i + 1] === '\r') i += 2;
			else i += 1;
		}
	}

	return root;
};
