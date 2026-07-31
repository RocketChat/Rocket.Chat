import type { MouseEvent } from 'react';

import { getModifierClickHref } from './messageBoxHelpers';

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
});
