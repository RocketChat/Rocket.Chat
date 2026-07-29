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

afterEach(() => {
	window.getSelection()?.removeAllRanges();
	document.body.innerHTML = '';
});

describe('caret round-trip on real rendered markup', () => {
	it.each([
		['plain text', 'hello world', 'hello world\n'],
		['bold', 'a *bold* b', 'a *bold* b\n'],
		['italic', 'a _em_ b', 'a _em_ b\n'],
		['inline code', 'a `code` b', 'a `code` b\n'],
		['heading', '# Title', '# Title\n'],
		['multiline', 'first\nsecond\nthird', 'first\nsecond\nthird\n'],
	])('preserves every caret offset for %s', (_label, text, rendered) => {
		const input = mountMarkup(text);

		expect(input.textContent).toBe(rendered);

		const { length } = rendered;

		for (let n = 0; n <= length; n++) {
			setSelectionRange(input, n, n);
			expect(getSelectionRange(input)).toEqual({ selectionStart: n, selectionEnd: n });
		}
	});
});
