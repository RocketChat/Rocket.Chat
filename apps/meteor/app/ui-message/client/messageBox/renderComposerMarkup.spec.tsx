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

describe('link styling', () => {
	const anchorsOf = (text: string): HTMLAnchorElement[] => Array.from(mountMarkup(text).querySelectorAll('a'));

	it.each([
		['markdown link', 'see [the docs](https://rocket.chat/docs)', '[the docs](https://rocket.chat/docs)', 'https://rocket.chat/docs'],
		['bare domain', 'see rocket.chat/docs now', 'rocket.chat/docs', 'https://rocket.chat/docs'],
		['email', 'mail me@rocket.chat now', 'me@rocket.chat', 'mailto:me@rocket.chat'],
	])('keeps the %s markup as the anchor text and only adds the href', (_label, text, expectedText, expectedHref) => {
		const anchors = anchorsOf(text);

		expect(anchors).toHaveLength(1);
		expect(anchors[0].textContent).toBe(expectedText);
		expect(anchors[0].getAttribute('href')).toBe(expectedHref);
	});

	it('styles every link like the message list does', () => {
		const [anchor] = anchorsOf('see [the docs](https://rocket.chat/docs)');

		expect(anchor.getAttribute('style')).toBe('color:var(--rcx-color-font-info, #095ad2);text-decoration:underline');
		expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('renders a link nested in other markup inside it', () => {
		const [anchor] = anchorsOf('a *[docs](https://rocket.chat)* b');

		expect(anchor.closest('strong')).not.toBeNull();
		expect(anchor.textContent).toBe('[docs](https://rocket.chat)');
	});

	it.each([
		['javascript', 'see [x](javascript:alert(1))'],
		['data', 'see [x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
		['vbscript', 'see [x](vbscript:msgbox(1))'],
	])('drops a %s href while keeping the typed text', (_label, text) => {
		const input = mountMarkup(text);
		const anchors = Array.from(input.querySelectorAll('a'));

		expect(anchors).toHaveLength(1);
		expect(anchors[0].getAttribute('href')).toBeNull();
		expect(stripLineEnd(input.textContent ?? '')).toBe(stripLineEnd(text));
	});

	it('never renders an element the composer cannot emit', () => {
		const input = mountMarkup('see [<img src=x onerror=alert(1)>](https://rocket.chat/<script>alert(2)</script>)');

		expect(input.querySelector('img')).toBeNull();
		expect(input.querySelector('script')).toBeNull();
	});
});

describe('link scheme policy', () => {
	const hrefOf = (text: string): string | null => {
		const anchors = Array.from(mountMarkup(text).querySelectorAll('a'));

		expect(anchors).toHaveLength(1);

		return anchors[0].getAttribute('href');
	};

	it.each([
		['http', 'see [x](http://rocket.chat/docs)', 'http://rocket.chat/docs'],
		['https', 'see [x](https://rocket.chat/docs)', 'https://rocket.chat/docs'],
		['mailto', 'see [x](mailto:me@rocket.chat)', 'mailto:me@rocket.chat'],
		['tel', 'see [x](tel:+15551234567)', 'tel:+15551234567'],
	])('keeps the href of a %s link', (_label, text, expected) => {
		expect(hrefOf(text)).toBe(expected);
	});

	it.each([
		['javascript', 'see [x](javascript:alert(1))'],
		['data', 'see [x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
		['vbscript', 'see [x](vbscript:msgbox(1))'],
		['file', 'see [x](file:///etc/passwd)'],
		['smb', 'see [x](smb://attacker.example/share)'],
		['blob', 'see [x](blob:https://rocket.chat/2b1f)'],
		['vscode', 'see [x](vscode://file/etc/passwd)'],
		['ms-msdt', 'see [x](ms-msdt:/id)'],
		['intent', 'see [x](intent://evil.example)'],
		['jar', 'see [x](jar:http://evil.example/a.jar)'],
	])('refuses the href of a %s link', (_label, text) => {
		expect(hrefOf(text)).toBeNull();
	});

	it.each([
		['javascript', 'see [x](javascript:alert(1))'],
		['file', 'see [x](file:///etc/passwd)'],
		['smb', 'see [x](smb://attacker.example/share)'],
	])('keeps the typed text of a refused %s link', (_label, text) => {
		expect(stripLineEnd(mountMarkup(text).textContent ?? '')).toBe(stripLineEnd(text));
	});
});

describe('schemeless links', () => {
	const hrefOf = (text: string): string => {
		const anchors = Array.from(mountMarkup(text).querySelectorAll('a'));

		expect(anchors).toHaveLength(1);

		return anchors[0].getAttribute('href') ?? '';
	};

	it('resolves a bare domain to an explicit scheme instead of inheriting the page scheme', () => {
		const href = hrefOf('see rocket.chat/docs now');

		expect(() => new URL(href)).not.toThrow();
		expect(new URL(href).protocol).toBe('https:');
	});

	it('normalizes a schemeless target so a backslash cannot disguise the real host', () => {
		const href = hrefOf('see [x](evil.example\\@rocket.chat)');

		expect(() => new URL(href)).not.toThrow();
		expect(new URL(href).hostname).toBe('evil.example');
	});
});

describe('list styling', () => {
	it.each([
		['unordered', '- one\n- two', /^- $/],
		['ordered', '1. one\n3. three', /^\d+\. $/],
	])('emphasizes every %s item marker like the message list does', (_label, text, markerPattern) => {
		const markers = Array.from(mountMarkup(text).querySelectorAll('span')).filter((span) => markerPattern.test(span.textContent ?? ''));

		expect(markers).toHaveLength(2);

		for (const marker of markers) {
			expect(marker.getAttribute('style')).toBe('font-weight:700;padding-inline-start:0.5rem');
		}
	});

	it('keeps the numbers the user typed instead of renumbering', () => {
		const markers = Array.from(mountMarkup('1. one\n3. three\n2. two').querySelectorAll('span'))
			.filter((span) => /^\d+\. $/.test(span.textContent ?? ''))
			.map((span) => span.textContent);

		expect(markers).toEqual(['1. ', '3. ', '2. ']);
	});
});

const lossy: [string, string][] = [
	['asterisk list', '* one\n* two'],
	['hyphen list with extra spacing', '-  one'],
	['ordered list with a leading zero', '01. one'],
	['ordered list with extra spacing', '1.  one'],
	['slack-style link', '<https://rocket.chat|docs>'],
	['phone link', 'call +15551234567 now'],
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
