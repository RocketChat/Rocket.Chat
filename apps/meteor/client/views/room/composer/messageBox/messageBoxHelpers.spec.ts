import type { ClipboardEvent, MouseEvent } from 'react';

import * as messageBoxHelpers from './messageBoxHelpers';
import { getClickedLink, getModifierClickHref } from './messageBoxHelpers';

const setPlatform = (platform: string): void => {
	Object.defineProperty(window.navigator, 'platform', { value: platform, configurable: true });
};

const clickOn = (html: string, modifiers: { metaKey?: boolean; ctrlKey?: boolean } = {}): string | undefined => {
	const container = document.createElement('div');
	container.innerHTML = html;
	document.body.appendChild(container);

	const target = (container.querySelector('[data-target]') ?? container.firstElementChild ?? container) as HTMLElement;

	return getModifierClickHref({ metaKey: false, ctrlKey: false, ...modifiers, target } as unknown as MouseEvent<HTMLElement>);
};

const originalPlatform = window.navigator.platform;

afterEach(() => {
	setPlatform(originalPlatform);
	document.body.innerHTML = '';
});

describe('getModifierClickHref', () => {
	it('ignores a click without the platform modifier so it only moves the caret', () => {
		setPlatform('Linux x86_64');

		expect(clickOn('<a href="https://rocket.chat">rocket.chat</a>')).toBeUndefined();
	});

	it('resolves the href on ctrl+click outside macOS', () => {
		setPlatform('Linux x86_64');

		expect(clickOn('<a href="https://rocket.chat">rocket.chat</a>', { ctrlKey: true })).toBe('https://rocket.chat');
		expect(clickOn('<a href="https://rocket.chat">rocket.chat</a>', { metaKey: true })).toBeUndefined();
	});

	it('resolves the href on cmd+click on macOS', () => {
		setPlatform('MacIntel');

		expect(clickOn('<a href="https://rocket.chat">rocket.chat</a>', { metaKey: true })).toBe('https://rocket.chat');
		expect(clickOn('<a href="https://rocket.chat">rocket.chat</a>', { ctrlKey: true })).toBeUndefined();
	});

	it('finds the link when the click lands on markup nested in it', () => {
		setPlatform('Linux x86_64');

		expect(clickOn('<a href="//rocket.chat/docs"><strong data-target>docs</strong></a>', { ctrlKey: true })).toBe('//rocket.chat/docs');
	});

	it('ignores a click outside a link', () => {
		setPlatform('Linux x86_64');

		expect(clickOn('<span data-target>plain text</span>', { ctrlKey: true })).toBeUndefined();
	});

	it('ignores a link whose href the renderer refused to trust', () => {
		setPlatform('Linux x86_64');

		expect(clickOn('<a href="#">[x](javascript:alert(1))</a>', { ctrlKey: true })).toBeUndefined();
	});

	it('ignores a link the renderer left without an href', () => {
		setPlatform('Linux x86_64');

		expect(clickOn('<a>[x](javascript:alert(1))</a>', { ctrlKey: true })).toBeUndefined();
	});
});

describe('getModifierClickHref on anchors the renderer did not produce', () => {
	beforeEach(() => {
		setPlatform('Linux x86_64');
	});

	it.each([
		['javascript', 'javascript:alert(1)'],
		['data', 'data:text/html,<script>alert(1)</script>'],
		['vbscript', 'vbscript:msgbox(1)'],
		['file', 'file:///etc/passwd'],
		['smb', 'smb://attacker.example/share'],
		['ms-msdt', 'ms-msdt:/id'],
	])('refuses a %s href that entered the composer outside the renderer', (_label, href) => {
		expect(clickOn(`<a href="${href}">x</a>`, { ctrlKey: true })).toBeUndefined();
	});

	it.each([
		['http', 'http://rocket.chat/docs'],
		['https', 'https://rocket.chat/docs'],
		['mailto', 'mailto:me@rocket.chat'],
	])('still resolves a %s href', (_label, href) => {
		expect(clickOn(`<a href="${href}">x</a>`, { ctrlKey: true })).toBe(href);
	});
});

describe('getClickedLink', () => {
	const linkOn = (html: string): HTMLAnchorElement | null => {
		const container = document.createElement('div');
		container.innerHTML = html;
		document.body.appendChild(container);

		const target = (container.querySelector('[data-target]') ?? container.firstElementChild ?? container) as HTMLElement;

		return getClickedLink({ metaKey: false, ctrlKey: false, target } as unknown as MouseEvent<HTMLElement>);
	};

	it('reports the link of an unmodified click so the router cannot navigate away', () => {
		expect(linkOn('<a href="#">[x](javascript:alert(1))</a>')?.getAttribute('href')).toBe('#');
	});

	it('reports a link pointing at the server itself', () => {
		expect(linkOn('<a href="https://rocket.chat/admin/rooms">x</a>')?.getAttribute('href')).toBe('https://rocket.chat/admin/rooms');
	});

	it('reports the link when the click lands on markup nested in it', () => {
		expect(linkOn('<a href="//rocket.chat/docs"><strong data-target>docs</strong></a>')?.getAttribute('href')).toBe('//rocket.chat/docs');
	});

	it('reports nothing for a click outside a link', () => {
		expect(linkOn('<span data-target>plain text</span>')).toBeNull();
	});
});

describe('pasting into the composer', () => {
	// The paste guard has no home yet; this is the surface the fix has to expose.
	const extractPastedPlainText = (messageBoxHelpers as Record<string, unknown>).extractPastedPlainText as
		| ((event: ClipboardEvent<HTMLElement>) => string | undefined)
		| undefined;

	const clipboardEvent = (data: Record<string, string>): ClipboardEvent<HTMLElement> =>
		({
			clipboardData: {
				types: Object.keys(data),
				items: Object.keys(data).map((type) => ({ kind: 'string', type })),
				files: [],
				getData: (type: string) => data[type] ?? '',
			},
		}) as unknown as ClipboardEvent<HTMLElement>;

	it('exposes a helper deciding what a paste is allowed to insert', () => {
		expect(typeof extractPastedPlainText).toBe('function');
	});

	it.each([
		['an anchor', '<a href="javascript:alert(1)">docs</a>', 'docs'],
		['an image with an inline handler', '<img src=x onerror="alert(1)">', ''],
		['a styled fragment', '<b style="color:red">bold</b>', 'bold'],
	])('intercepts a paste carrying %s and yields only its plain text', (_label, html, plain) => {
		expect(extractPastedPlainText?.(clipboardEvent({ 'text/html': html, 'text/plain': plain }))).toBe(plain);
	});

	it('lets a plain-text-only paste reach the browser default', () => {
		expect(extractPastedPlainText?.(clipboardEvent({ 'text/plain': 'see rocket.chat/docs' }))).toBeUndefined();
	});
});
