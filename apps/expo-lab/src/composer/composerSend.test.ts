/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createComposerSend } from './composerSend.ts';
import { createNativeComposerAPI } from './createNativeComposerAPI.ts';

const enter = { nativeEvent: { key: 'Enter' } };
const other = { nativeEvent: { key: 'a' } };
const tick = () => new Promise((resolve) => setImmediate(resolve));

const make = (text = '', caret = text.length, { sendOnEnter = true, result = true as boolean | void } = {}) => {
	const api = createNativeComposerAPI(text);
	api.setSelection({ start: caret, end: caret });
	const sent: string[] = [];
	let focused = 0;
	api.attachField({ focus: () => (focused += 1), blur: () => undefined });
	const options = { sendOnEnter };
	const composer = createComposerSend({
		api,
		onSubmit: (t) => {
			sent.push(t);
			return result;
		},
		sendOnEnter: () => options.sendOnEnter,
	});
	return { api, sent, composer, options, focused: () => focused };
};

// What the native field reports for a Return pressed at the caret
const returnText = (api: ReturnType<typeof createNativeComposerAPI>) =>
	`${api.text.slice(0, api.selection.start)}\n${api.text.slice(api.selection.end)}`;

describe('send button (R5, R6, R9, R12)', () => {
	it('sends with sendOnEnter on and off, then clears and keeps focus', async () => {
		for (const sendOnEnter of [true, false]) {
			const { api, sent, composer, focused } = make('hello', 5, { sendOnEnter });
			composer.submit();
			await tick();
			assert.deepEqual(sent, ['hello']);
			assert.equal(api.text, '');
			assert.equal(focused(), 1);
		}
	});

	it('sends nothing for empty, spaces and newlines, and leaves the field as it was', () => {
		for (const text of ['', '   ', '\n\n', ' \n \t']) {
			const { api, sent, composer } = make(text);
			composer.submit();
			assert.deepEqual(sent, []);
			assert.equal(api.text, text);
		}
	});

	it('trims and closes an unclosed fence', () => {
		const { sent, composer } = make('  ```js\nlet a\n  ');
		composer.submit();
		assert.deepEqual(sent, ['```js\nlet a\n```']);
	});

	it('sends once when the button fires twice', () => {
		const { sent, composer } = make('hi');
		composer.submit();
		composer.submit();
		assert.deepEqual(sent, ['hi']);
	});

	it('keeps the text when the send fails', async () => {
		const { api, composer } = make('  keep me ', 10, { result: false });
		composer.submit();
		assert.equal(api.text, '');
		await tick();
		assert.equal(api.text, '  keep me ');
	});

	it('does not overwrite what was typed while a failed send was in flight', async () => {
		const { api, composer } = make('first', 5, { result: false });
		composer.submit();
		composer.onChangeText('n');
		await tick();
		assert.equal(api.text, 'n');
	});
});

describe('Return with sendOnEnter on (R7)', () => {
	it('key first: sends without the line break and swallows the change that follows', () => {
		const { api, sent, composer } = make('hello');
		const broken = returnText(api);
		composer.onKeyPress(enter);
		composer.onChangeText(broken);
		assert.deepEqual(sent, ['hello']);
		assert.equal(api.text, '');
	});

	it('change first: strips exactly the inserted line break and sends', () => {
		const { api, sent, composer } = make('hello');
		composer.onChangeText(returnText(api));
		composer.onKeyPress(enter);
		assert.deepEqual(sent, ['hello']);
		assert.equal(api.text, '');
	});

	it('change first, caret in the middle: keeps the other line breaks', () => {
		const { api, sent, composer } = make('ab\ncd', 2);
		composer.onChangeText(returnText(api));
		composer.onKeyPress(enter);
		assert.deepEqual(sent, ['ab\ncd']);
	});

	it('key first, caret in the middle', () => {
		const { api, sent, composer } = make('abcd', 2);
		const broken = returnText(api);
		composer.onKeyPress(enter);
		composer.onChangeText(broken);
		assert.deepEqual(sent, ['abcd']);
		assert.equal(api.text, '');
	});

	it('Return on an empty field sends nothing and the line break does not land (either order)', () => {
		const a = make('');
		a.composer.onKeyPress(enter);
		a.composer.onChangeText(returnText(a.api));
		assert.deepEqual(a.sent, []);
		assert.equal(a.api.text, '');

		const b = make('');
		b.composer.onChangeText(returnText(b.api));
		b.composer.onKeyPress(enter);
		assert.deepEqual(b.sent, []);
		assert.equal(b.api.text, '');
	});

	it('a line break typed earlier is not mistaken for the Return of a later key', () => {
		const { api, sent, composer } = make('hello');
		composer.onChangeText('hello\n');
		composer.onKeyPress(other);
		composer.onKeyPress(enter);
		assert.deepEqual(sent, ['hello']);
		assert.equal(api.text, '');
	});

	it('the swallow lasts one change only', () => {
		const { api, composer } = make('hello');
		composer.onKeyPress(enter);
		composer.onChangeText('x');
		assert.equal(api.text, 'x');
	});

	it('Return plus the button for the same text sends once', () => {
		const { api, sent, composer } = make('hello');
		composer.onChangeText(returnText(api));
		composer.onKeyPress(enter);
		composer.submit();
		assert.deepEqual(sent, ['hello']);
	});

	it('restores the text on failure, without the line break', async () => {
		const { api, composer } = make('hello', 5, { result: false });
		composer.onChangeText(returnText(api));
		composer.onKeyPress(enter);
		await tick();
		assert.equal(api.text, 'hello');
	});
});

describe('Return with sendOnEnter off (R8)', () => {
	it('sends nothing and keeps the line break at the caret, either order', () => {
		const a = make('abcd', 2, { sendOnEnter: false });
		const broken = returnText(a.api);
		a.composer.onKeyPress(enter);
		a.composer.onChangeText(broken);
		assert.equal(a.api.text, 'ab\ncd');
		assert.deepEqual(a.sent, []);

		const b = make('abcd', 2, { sendOnEnter: false });
		b.composer.onChangeText(returnText(b.api));
		b.composer.onKeyPress(enter);
		assert.equal(b.api.text, 'ab\ncd');
		assert.deepEqual(b.sent, []);
	});

	it('follows the setting as it is toggled', () => {
		const { api, sent, composer, options } = make('hi', 2, { sendOnEnter: false });
		composer.onKeyPress(enter);
		options.sendOnEnter = true;
		composer.onKeyPress(enter);
		assert.deepEqual(sent, ['hi']);
		assert.equal(api.text, '');
	});
});
