/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createNativeComposerAPI } from './createNativeComposerAPI.ts';

const make = (text = '', start = text.length, end = start) => {
	const api = createNativeComposerAPI(text);
	api.setSelection({ start, end });
	const seen: { text: string; start: number; end: number }[] = [];
	api.subscribe(() => seen.push({ text: api.text, start: api.selection.start, end: api.selection.end }));
	return { api, seen };
};

describe('state and notifications', () => {
	it('starts with the caret at the end', () => {
		const api = createNativeComposerAPI('abc');
		assert.deepEqual(api.selection, { start: 3, end: 3 });
	});

	it('notifies once per edit, with text and selection already changed together', () => {
		const { api, seen } = make('hello', 5);
		api.insertText(' world');
		assert.deepEqual(seen, [{ text: 'hello world', start: 11, end: 11 }]);
	});

	it('does not notify when nothing changes', () => {
		const { api, seen } = make('hello', 2);
		api.setSelection({ start: 2, end: 2 });
		api.setCursorToStart();
		api.setCursorToStart();
		assert.equal(seen.length, 1);
	});

	it('stops notifying after unsubscribe and release', () => {
		const api = createNativeComposerAPI();
		let calls = 0;
		const off = api.subscribe(() => (calls += 1));
		api.setText('a');
		off();
		api.setText('b');
		api.subscribe(() => (calls += 1));
		api.release();
		api.setText('c');
		assert.equal(calls, 1);
	});
});

describe('setText', () => {
	it('replaces the value and puts the caret at the end', () => {
		const { api } = make('old', 1);
		api.setText('brand new');
		assert.deepEqual([api.text, api.selection], ['brand new', { start: 9, end: 9 }]);
	});

	it('with a selection option replaces the current selection, then places the range', () => {
		const { api } = make('hello world', 6, 11);
		api.setText('there', { selection: { start: 6, end: 11 } });
		assert.deepEqual([api.text, api.selection], ['hello there', { start: 6, end: 11 }]);
	});

	it('passes the previous selection to a selection function', () => {
		const { api } = make('ab', 1);
		let previous;
		api.setText('X', {
			selection: (p) => {
				previous = p;
				return { start: 0, end: 0 };
			},
		});
		assert.deepEqual(previous, { start: 1, end: 1 });
		assert.equal(api.text, 'aXb');
	});
});

describe('insertText', () => {
	it('inserts at the caret and moves it after the text', () => {
		const { api } = make('hello', 2);
		api.insertText('XY');
		assert.deepEqual([api.text, api.selection], ['heXYllo', { start: 4, end: 4 }]);
	});

	it('replaces a selection and shifts the range by the length, clamped to the text (web arithmetic)', () => {
		const { api } = make('hello world', 6, 11);
		api.insertText('Z');
		assert.deepEqual([api.text, api.selection], ['hello Z', { start: 7, end: 7 }]);
	});

	it('insertNewLine inserts a line break', () => {
		const { api } = make('ab', 1);
		api.insertNewLine();
		assert.deepEqual([api.text, api.selection], ['a\nb', { start: 2, end: 2 }]);
	});
});

describe('replaceText', () => {
	it('replaces the range and collapses the caret after the new text (a mention)', () => {
		const { api } = make('hi @a', 5);
		api.replaceText('@ada ', { start: 3, end: 5 });
		assert.deepEqual([api.text, api.selection], ['hi @ada ', { start: 8, end: 8 }]);
	});

	it('clamps a range outside the text', () => {
		const { api } = make('abc', 0);
		api.replaceText('Z', { start: 2, end: 99 });
		assert.deepEqual([api.text, api.selection], ['abZ', { start: 3, end: 3 }]);
	});
});

describe('clear, cursor and substring', () => {
	it('clear empties the text and the selection', () => {
		const { api } = make('abc', 1, 2);
		api.clear();
		assert.deepEqual([api.text, api.selection], ['', { start: 0, end: 0 }]);
	});

	it('moves the caret to the end and to the start', () => {
		const { api } = make('abc', 1, 2);
		api.setCursorToEnd();
		assert.deepEqual(api.selection, { start: 3, end: 3 });
		api.setCursorToStart();
		assert.deepEqual(api.selection, { start: 0, end: 0 });
		assert.equal(api.getCursorPosition(), 0);
	});

	it('substring follows String.prototype.substring', () => {
		const { api } = make('hello');
		assert.equal(api.substring(1, 3), 'el');
		assert.equal(api.substring(3), 'lo');
		assert.equal(api.substring(4, 1), 'ell');
	});
});

describe('wrapSelection', () => {
	it('wraps a selection and keeps the wrapped text selected', () => {
		const { api } = make('hello world', 6, 11);
		const result = api.wrapSelection('*{{text}}*');
		assert.deepEqual(result, { selectionStart: 7, selectionEnd: 12, value: 'hello *world*' });
		assert.deepEqual(api.selection, { start: 7, end: 12 });
	});

	it('toggles off when the markers already surround the selection', () => {
		const { api } = make('hello *world*', 7, 12);
		api.wrapSelection('*{{text}}*');
		assert.deepEqual([api.text, api.selection], ['hello world', { start: 6, end: 11 }]);
	});

	it('wrapping twice returns to the original', () => {
		const { api } = make('hello world', 6, 11);
		api.wrapSelection('_{{text}}_');
		api.wrapSelection('_{{text}}_');
		assert.equal(api.text, 'hello world');
	});

	it('with an empty selection inserts the empty pattern with the caret inside it', () => {
		const { api } = make('hello world', 5);
		api.wrapSelection('*{{text}}*');
		assert.deepEqual([api.text, api.selection], ['hello** world', { start: 6, end: 6 }]);
	});

	it('is one notification', () => {
		const { api, seen } = make('hello world', 6, 11);
		api.wrapSelection('`{{text}}`');
		assert.equal(seen.length, 1);
	});
});

describe('UTF-16 offsets', () => {
	it('wraps around a surrogate pair', () => {
		const { api } = make('a😀b', 1, 3);
		api.wrapSelection('*{{text}}*');
		assert.equal(api.text, 'a*😀*b');
		assert.deepEqual(api.selection, { start: 2, end: 4 });
	});

	it('inserts after a ZWJ family using UTF-16 length', () => {
		const family = '👨‍👩‍👧';
		const { api } = make(family);
		assert.equal(family.length, 8);
		api.insertText('!');
		assert.deepEqual([api.text, api.selection], [`${family}!`, { start: 9, end: 9 }]);
	});

	it('keeps a combining mark with its base when replacing around it', () => {
		const text = 'éx';
		const { api } = make(text, 2, 3);
		api.replaceText('y', { start: 2, end: 3 });
		assert.equal(api.text, 'éy');
	});
});

describe('selection clamping', () => {
	it('clamps a selection past the text and orders a reversed one', () => {
		const { api } = make('abc');
		api.setSelection({ start: 9, end: 20 });
		assert.deepEqual(api.selection, { start: 3, end: 3 });
		api.setSelection({ start: 2, end: -4 });
		assert.deepEqual(api.selection, { start: 0, end: 2 });
	});

	it('clamps the selection when the text shrinks', () => {
		const { api } = make('abcdef', 6);
		api.setText('ab', { selection: { start: 5, end: 5 } });
		assert.equal(api.selection.end <= api.text.length, true);
	});
});

describe('echo guard and user edits', () => {
	it('ignores a selection report equal to the one just written', () => {
		const { api, seen } = make('hello world', 6, 11);
		api.wrapSelection('*{{text}}*');
		const written = api.selection;
		api.setSelection({ ...written });
		assert.equal(seen.length, 1);
	});

	it('takes a selection the user moved', () => {
		const { api, seen } = make('hello', 5);
		api.setSelection({ start: 1, end: 3 });
		assert.deepEqual(api.selection, { start: 1, end: 3 });
		assert.equal(seen.length, 1);
	});

	it('moves the caret by the length of a typed change before native reports it', () => {
		const { api } = make('helo', 2);
		api.userEdit('hello');
		assert.deepEqual([api.text, api.selection], ['hello', { start: 3, end: 3 }]);
		api.userEdit('hell');
		assert.deepEqual(api.selection, { start: 2, end: 2 });
	});

	it('typing over a selection puts the caret after the typed character', () => {
		const { api } = make('hello world', 6, 11);
		api.userEdit('hello X');
		assert.deepEqual(api.selection, { start: 7, end: 7 });
	});

	it('the selection native reports after a typed change corrects the estimate without a second text change', () => {
		const { api, seen } = make('ab', 1);
		api.userEdit('aXb');
		api.setSelection({ start: 2, end: 2 });
		assert.equal(seen.length, 1);
	});
});

describe('inert and minimal members', () => {
	it('has inert recording constants and a null composerRef', () => {
		const api = createNativeComposerAPI();
		api.setRecordingMode(true);
		assert.equal(api.recording.get(), false);
		assert.equal(api.recordingVideo.get(), false);
		assert.equal(api.isMicrophoneDenied.get(), false);
		assert.equal(api.composerRef.current, null);
		assert.deepEqual(api.formatters.get(), []);
	});

	it('keeps quoted messages without duplicates and dismisses them, leaving the text alone', async () => {
		const api = createNativeComposerAPI('draft');
		const message = { _id: 'm1' } as Parameters<typeof api.quoteMessage>[0];
		let calls = 0;
		api.quotedMessages.subscribe(() => (calls += 1));
		await api.quoteMessage(message);
		await api.quoteMessage(message);
		assert.equal(api.quotedMessages.get().length, 1);
		await api.dismissQuotedMessage('m1');
		assert.equal(api.quotedMessages.get().length, 0);
		assert.equal(api.text, 'draft');
		assert.equal(calls, 2);
	});

	it('focus and blur reach the attached field and are safe without one', () => {
		const api = createNativeComposerAPI();
		api.focus();
		const calls: string[] = [];
		api.attachField({ focus: () => calls.push('focus'), blur: () => calls.push('blur') });
		api.focus();
		api.blur();
		assert.deepEqual(calls, ['focus', 'blur']);
	});
});
