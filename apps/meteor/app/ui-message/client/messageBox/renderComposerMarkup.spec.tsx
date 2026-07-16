import { parse } from '@rocket.chat/message-parser';

import { renderComposerMarkup } from './renderComposerMarkup';
import { getSelectionRange, setSelectionRange } from './selectionRange';

jest.mock('../../../../client/lib/utils/renderEmoji', () => ({
	getEmojiClassNameAndDataTitle: () => ({}),
}));

const mountMarkup = (text: string): HTMLDivElement => {
	const input = document.createElement('div');
	input.innerHTML = renderComposerMarkup(parse(text, {}), {});
	document.body.appendChild(input);
	return input;
};

const flatLength = (input: HTMLDivElement): number => {
	setSelectionRange(input, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
	return getSelectionRange(input).selectionStart;
};

afterEach(() => {
	window.getSelection()?.removeAllRanges();
	document.body.innerHTML = '';
});

describe('caret round-trip on real rendered markup', () => {
	it.each([
		['plain text', 'hello world'],
		['bold', 'a *bold* b'],
		['italic', 'a _em_ b'],
		['inline code', 'a `code` b'],
		['heading', '# Title'],
		['multiline', 'first\nsecond\nthird'],
	])('preserves every caret offset for %s', (_label, text) => {
		const input = mountMarkup(text);
		const length = flatLength(input);

		for (let n = 0; n <= length; n++) {
			setSelectionRange(input, n, n);
			expect(getSelectionRange(input)).toEqual({ selectionStart: n, selectionEnd: n });
		}
	});
});
