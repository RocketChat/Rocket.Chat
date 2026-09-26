import { renderComposerMarkup } from '@rocket.chat/gazzodown-alt';
import { parse } from '@rocket.chat/message-parser';

import { renderComposerContent } from './messageStateHandler';
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

describe('caret round-trip on real rendered markup', () => {
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
		['markdown link inside bold', 'a *[docs](https://rocket.chat)* b'],
		['link with an unsafe scheme', 'see [x](javascript:alert(1))'],
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
		['ordered list numbered out of order', '1. one\n3. three\n2. two'],
		['ordered list not starting at one', '7. seven\n8. eight'],
		['ordered list item with inline markup', '1. *bold* one'],
		['ordered list followed by a paragraph', '1. one\ntext after'],
		['tasks', '- [x] done\n- [ ] todo'],
		['emoji shortcode', 'hi :smile: there'],
		['emoji shortcode alone', ':smile:'],
		['unicode emoji in text', 'hi 😄 there'],
		['unicode emoji alone', '😄'],
	])('preserves every caret offset over %s', (_label, text) => {
		const input = mountMarkup(text);
		const rendered = input.textContent ?? '';

		for (let n = 0; n <= rendered.length; n++) {
			setSelectionRange(input, n, n);
			expect(getSelectionRange(input)).toEqual({ selectionStart: n, selectionEnd: n });
		}
	});
});

describe('markup reaching the composer', () => {
	it.each([
		['inline markup', 'a *bold* _em_ b'],
		['a link', 'see [the docs](https://rocket.chat/docs)'],
		['a list', '- one\n- two'],
	])('renders %s as the text it was typed from', (_label, text) => {
		expect(stripLineEnd(mountMarkup(text).textContent ?? '')).toBe(text);
	});
});

describe('markup the renderer cannot reproduce', () => {
	it.each([
		['asterisk list', '* one\n* two'],
		['hyphen list with extra spacing', '-  one'],
		['ordered list with a leading zero', '01. one'],
		['ordered list with extra spacing', '1.  one'],
		['slack-style link', '<https://rocket.chat|docs>'],
		['phone link', 'call +15551234567 now'],
		['padded horizontal rule', '  ---'],
		['several big emoji', '😄 😄'],
	])('keeps every character of %s through the text guard', (_label, text) => {
		expect(stripLineEnd(mountComposer(text).textContent ?? '')).toBe(text);
	});
});
