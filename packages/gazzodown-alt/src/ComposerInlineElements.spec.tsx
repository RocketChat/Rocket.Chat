import type * as MessageParser from '@rocket.chat/message-parser';

import { mountInline } from './testUtils';

const plain = (value: string): MessageParser.Plain => ({ type: 'PLAIN_TEXT', value });

describe('emphasis', () => {
	it.each([
		['bold', { type: 'BOLD', value: [plain('x')] } as MessageParser.Bold, 'strong', '*x*'],
		['italic', { type: 'ITALIC', value: [plain('x')] } as MessageParser.Italic, 'em', '_x_'],
		['strike', { type: 'STRIKE', value: [plain('x')] } as MessageParser.Strike, 'del', '~x~'],
	])('wraps %s in a semantic element', (_label, node, tagName, expectedText) => {
		const input = mountInline([node]);

		expect(input.textContent).toBe(expectedText);
		expect(input.querySelector(tagName)?.textContent).toBe('x');
	});

	it('keeps the delimiters outside the emphasis element so the caret can sit between them', () => {
		const input = mountInline([{ type: 'BOLD', value: [plain('x')] }]);
		const strong = input.querySelector('strong');

		expect(strong?.previousSibling?.textContent).toBe('*');
		expect(strong?.nextSibling?.textContent).toBe('*');
	});

	it('nests emphasis inside emphasis', () => {
		const input = mountInline([{ type: 'BOLD', value: [{ type: 'ITALIC', value: [plain('x')] }] }]);

		expect(input.textContent).toBe('*_x_*');
		expect(input.querySelector('strong em')).not.toBeNull();
	});
});

describe('spoiler', () => {
	it('keeps the pipes outside the hidden span', () => {
		const input = mountInline([{ type: 'SPOILER', value: [plain('secret')] }]);

		expect(input.textContent).toBe('||secret||');
		expect(input.querySelector('span')?.textContent).toBe('secret');
	});
});

describe('code', () => {
	it('keeps the backticks outside the code element', () => {
		const input = mountInline([{ type: 'INLINE_CODE', value: plain('a = 1') }]);
		const code = input.querySelector('code');

		expect(input.textContent).toBe('`a = 1`');
		expect(code?.textContent).toBe('a = 1');
		expect(code?.className).toBe('code-colors inline');
	});
});

describe('mentions', () => {
	it.each([
		['all', 'relevant'],
		['here', 'relevant'],
		['rocket.cat', 'other'],
	])('highlights @%s as %s', (mention, variant) => {
		const input = mountInline([{ type: 'MENTION_USER', value: plain(mention) }]);

		expect(input.textContent).toBe(`@${mention}`);
		expect(input.querySelector('span')?.className).toBe(`rcx-message__highlight rcx-message__highlight--${variant}`);
	});

	it('highlights a channel mention as a link', () => {
		const input = mountInline([{ type: 'MENTION_CHANNEL', value: plain('general') }]);

		expect(input.textContent).toBe('#general');
		expect(input.querySelector('span')?.className).toBe('rcx-message__highlight rcx-message__highlight--link');
	});

	it('renders a mention as the typed text while resolution is unimplemented', () => {
		const resolveUserMention = jest.fn(() => ({ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat' }));
		const input = mountInline([{ type: 'MENTION_USER', value: plain('rocket.cat') }], { resolveUserMention });

		expect(input.textContent).toBe('@rocket.cat');
		expect(resolveUserMention).not.toHaveBeenCalled();
	});
});

describe('links', () => {
	const link = (src: string, label: MessageParser.Markup | MessageParser.Markup[]): MessageParser.Link => ({
		type: 'LINK',
		value: { src: plain(src), label },
	});

	it('keeps the typed markup as the anchor text and only adds the href', () => {
		const input = mountInline([link('https://rocket.chat/docs', plain('the docs'))]);
		const anchor = input.querySelector('a');

		expect(anchor?.textContent).toBe('[the docs](https://rocket.chat/docs)');
		expect(anchor?.getAttribute('href')).toBe('https://rocket.chat/docs');
	});

	it('opens external targets safely', () => {
		const input = mountInline([link('https://rocket.chat', plain('https://rocket.chat'))]);

		expect(input.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('drops a refused href while keeping the typed text', () => {
		const input = mountInline([link('javascript:alert(1)', plain('x'))]);
		const anchor = input.querySelector('a');

		expect(anchor?.getAttribute('href')).toBeNull();
		expect(input.textContent).toBe('[x](javascript:alert(1))');
	});
});

// TODO: As we implement these nodes, remove these tests
describe('nodes routed through the source fallback', () => {
	it('prints a timestamp as the markup it was parsed from', () => {
		const source = 'at <t:1700000000:t> ok';
		const node: MessageParser.Timestamp = { type: 'TIMESTAMP', value: { timestamp: '1700000000', format: 't' }, fallback: [3, 19] };

		expect(mountInline([node], { source }).textContent).toBe('<t:1700000000:t>');
	});

	it('prints an image as the markup it was parsed from, never as an image element', () => {
		const node: MessageParser.Image = {
			type: 'IMAGE',
			value: { src: plain('https://rocket.chat/a.png'), label: plain('alt') },
		};
		const input = mountInline([node]);

		expect(input.textContent).toBe('![alt](https://rocket.chat/a.png)');
		expect(input.querySelector('img')).toBeNull();
	});

	it('prints the stored text of a node the caller supplied a fallback for', () => {
		expect(mountInline([{ type: undefined, fallback: plain('$$x^2$$') }]).textContent).toBe('$$x^2$$');
	});

	it('prints nothing for a node with no source form, leaving the caller to guard the text', () => {
		expect(mountInline([{ type: 'COLOR', value: { r: 255, g: 0, b: 0, a: 1 } }]).textContent).toBe('');
	});
});
