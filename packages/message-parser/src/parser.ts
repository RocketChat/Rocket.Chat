import type { Root } from './definitions';
import type { Options } from './index';
import { paragraph, plain, lineBreak, reducePlainTexts } from './utils';
import { Scanner } from './scanner';
import { isNewline } from './chars';

export function parse(input: string, _options: Options = {}): Root {
	const root: Root = [];
	const scanner = new Scanner(input);

	while (!scanner.isEnd()) {
		const start = scanner.save();

		// Scan to end of line
		while (!scanner.isEnd() && !isNewline(scanner.char())) {
			scanner.advance();
		}

		const text = scanner.sliceFrom(start);
		const isLastPosition = scanner.isEnd();

		if (text === '') {
			if (!isLastPosition) {
				root.push(lineBreak());
			}
		} else {
			root.push(paragraph(reducePlainTexts([plain(text)])));
		}

		// Skip newline character(s)
		if (!isLastPosition) {
			if (scanner.char() === '\r' && scanner.charAt(1) === '\n') {
				scanner.advance(2);
			} else {
				scanner.advance(1);
			}
		}
	}

	return root;
}
