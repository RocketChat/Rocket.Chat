import { parse } from '@rocket.chat/message-parser';

import { renderComposerContent } from './messageStateHandler';
import { renderComposerMarkup } from './renderComposerMarkup';
import { getSelectionRange, setSelectionRange } from './selectionRange';

const mountMarkup = (text: string): HTMLDivElement => {
	const input = document.createElement('div');
	input.innerHTML = renderComposerMarkup(parse(text, {}), text);
	document.body.appendChild(input);
	return input;
};

const mountComposer = (text: string): HTMLDivElement => {
	const input = document.createElement('div');
	// jsdom does not implement innerText, which is what the composer reads.
	Object.defineProperty(input, 'innerText', { value: text, writable: true, configurable: true });
	document.body.appendChild(input);
	renderComposerContent(input, {}, { selectionStart: 0, selectionEnd: 0 });
	return input;
};

const stripLineEnd = (text: string): string => text.replace(/\n$/, '');

afterEach(() => {
	window.getSelection()?.removeAllRanges();
	document.body.innerHTML = '';
});

describe('text exactness and caret round-trip on real rendered markup', () => {
	it.each([
		['plain text', 'hello world'],
		['bold', 'a *bold* b'],
		['italic', 'a _em_ b'],
		['strike', 'a ~out~ b'],
		['spoiler', 'a ||hidden|| b'],
		['inline code', 'a `code` b'],
		['code block', '```js\nconst a = 1;\n```'],
		['heading', '# Title'],
		['heading with a link', '# see rocket.chat'],
		['quote', '> quoted'],
		['multiline', 'first\nsecond\nthird'],
		['user mention', 'hi @rocket.cat'],
		['channel mention', 'hi #general'],
		['markdown link', 'see [the docs](https://rocket.chat/docs)'],
		['bare domain', 'see rocket.chat/docs now'],
		['email', 'mail me@rocket.chat now'],
		['link inside bold', 'a *see rocket.chat* b'],
		['image', 'look ![alt](https://rocket.chat/a.png)'],
		['timestamp', 'at <t:1700000000:t> ok'],
		['horizontal rule', '---'],
		['horizontal rule between paragraphs', 'a\n---\nb'],
		['table', '|a|b|\n|-|-|\n|1|2|'],
		['hyphen list', '- one\n- two'],
		['list item with inline markup', '- *bold* one'],
		['list followed by a paragraph', '- one\ntext after'],
		['paragraph followed by a list', 'text before\n- one'],
		['lone hyphen marker', '- '],
		['ordered list', '1. one\n2. two'],
		['tasks', '- [x] done\n- [ ] todo'],
		['emoji shortcode', 'hi :smile: there'],
		['emoji shortcode alone', ':smile:'],
		['unicode emoji in text', 'hi 😄 there'],
		['unicode emoji alone', '😄'],
	])('renders %s as its own text and preserves every caret offset', (_label, text) => {
		const input = mountMarkup(text);
		const rendered = input.textContent ?? '';

		expect(stripLineEnd(rendered)).toBe(stripLineEnd(text));

		for (let n = 0; n <= rendered.length; n++) {
			setSelectionRange(input, n, n);
			expect(getSelectionRange(input)).toEqual({ selectionStart: n, selectionEnd: n });
		}
	});
});

describe('unordered list styling', () => {
	it('emphasizes every item marker like the message list does', () => {
		const markers = Array.from(mountMarkup('- one\n- two').querySelectorAll('span')).filter((span) => span.textContent === '- ');

		expect(markers).toHaveLength(2);

		for (const marker of markers) {
			expect(marker.getAttribute('style')).toBe('font-weight:700;padding-inline-start:0.5rem');
		}
	});
});

const lossy: [string, string][] = [
	['asterisk list', '* one\n* two'],
	['slack-style link', '<https://rocket.chat|docs>'],
	['padded horizontal rule', '  ---'],
	['several big emoji', '😄 😄'],
];

describe('markup the renderer cannot reproduce', () => {
	it.each(lossy)('does not reproduce %s', (_label, text) => {
		expect(stripLineEnd(mountMarkup(text).textContent ?? '')).not.toBe(stripLineEnd(text));
	});

	it.each(lossy)('keeps every character of %s through the text guard', (_label, text) => {
		expect(stripLineEnd(mountComposer(text).textContent ?? '')).toBe(stripLineEnd(text));
	});
});
