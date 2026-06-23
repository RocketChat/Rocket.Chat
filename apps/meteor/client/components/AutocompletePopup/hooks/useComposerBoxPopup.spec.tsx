import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, renderHook, waitFor } from '@testing-library/react';

import { useComposerBoxPopup } from './useComposerBoxPopup';
import { createMessageBoxPopupConfig } from '../ComposerPopupOption';
import type { EditableTextAdapter } from '../editableTextAdapter';

const keys = { ENTER: 13, ESC: 27, ARROW_UP: 38, ARROW_DOWN: 40 };

type Item = { _id: string; username?: string };

const createComposer = (text: string, caret = text.length) => ({
	substring: (start: number, end?: number) => text.substring(start, end),
	selection: { start: caret, end: caret },
	replaceText: jest.fn(),
});

const adapterFor = (composer: ReturnType<typeof createComposer>): EditableTextAdapter => ({
	textBeforeCaret: () => composer.substring(0, composer.selection.start),
	caret: () => composer.selection.start,
	replaceRange: (text, start, end) => composer.replaceText(text, { start, end }),
});

const userOption = createMessageBoxPopupConfig<Item>({
	trigger: '@',
	getItemsFromLocal: async () => [
		{ _id: 'u1', username: 'alice' },
		{ _id: 'u2', username: 'bob' },
	],
	getItemsFromServer: async () => [],
	getValue: (item) => item.username ?? '',
});

const emojiOption = createMessageBoxPopupConfig<Item>({
	trigger: ':',
	triggerLength: 2,
	getItemsFromLocal: async (filter: string) => [{ _id: `:${filter}a:` }, { _id: `:${filter}b:` }],
	getItemsFromServer: async () => [],
	getValue: (item) => item._id.substring(1),
});

const commandOption = createMessageBoxPopupConfig<Item>({
	trigger: '/',
	triggerAnywhere: false,
	getItemsFromLocal: async () => [{ _id: 'archive' }],
	getItemsFromServer: async () => [],
	getValue: (item) => item._id,
});

const options = [userOption, emojiOption, commandOption];

const setup = (text: string, caret = text.length) => {
	const composer = createComposer(text, caret);
	const node = document.createElement('textarea');

	const { result } = renderHook(() => useComposerBoxPopup(options, adapterFor(composer)), {
		wrapper: mockAppRoot().build(),
	});
	act(() => result.current.callbackRef(node));

	const fire = (type: 'keyUp' | 'keyDown', which: number) => fireEvent[type](node, { which, keyCode: which });

	return { result, composer, fire };
};

describe('useComposerBoxPopup (characterization)', () => {
	it('opens no popup when the text has no trigger', () => {
		const { result, fire } = setup('hello');
		fire('keyUp', 0);
		expect(result.current.option).toBeUndefined();
	});

	it('detects the `@` trigger and extracts the filter', () => {
		const { result, fire } = setup('hi @al');
		fire('keyUp', 0);
		expect(result.current.option?.trigger).toBe('@');
		expect(result.current.filter).toBe('al');
	});

	it('respects triggerLength: `:` alone does not open, `:ab` does', () => {
		const closed = setup('x :');
		closed.fire('keyUp', 0);
		expect(closed.result.current.option).toBeUndefined();

		const open = setup('x :ab');
		open.fire('keyUp', 0);
		expect(open.result.current.option?.trigger).toBe(':');
		expect(open.result.current.filter).toBe('ab');
	});

	it('only triggers a start-only (`/`) option at the very start of the text', () => {
		const mid = setup('hey /arch');
		mid.fire('keyUp', 0);
		expect(mid.result.current.option).toBeUndefined();

		const start = setup('/arch');
		start.fire('keyUp', 0);
		expect(start.result.current.option?.trigger).toBe('/');
		expect(start.result.current.filter).toBe('arch');
	});

	it('inserts prefix + value + suffix over the trigger range on select', async () => {
		const { result, composer, fire } = setup('hi @al');
		fire('keyUp', 0);
		await waitFor(() => expect(result.current.focused).toBeDefined());

		act(() => result.current.select?.({ _id: 'u1', username: 'alice' }));

		expect(composer.replaceText).toHaveBeenCalledWith('@alice ', { start: 3, end: 6 });
	});

	it('moves focus with arrow keys and wraps around', async () => {
		const { result, fire } = setup('hi @');
		fire('keyUp', 0);
		await waitFor(() => expect(result.current.focused?._id).toBe('u1'));

		fire('keyDown', keys.ARROW_DOWN);
		expect(result.current.focused?._id).toBe('u2');

		fire('keyDown', keys.ARROW_DOWN);
		expect(result.current.focused?._id).toBe('u1');

		fire('keyDown', keys.ARROW_UP);
		expect(result.current.focused?._id).toBe('u2');
	});

	it('selects the focused item on Enter', async () => {
		const { result, composer, fire } = setup('hi @');
		fire('keyUp', 0);
		await waitFor(() => expect(result.current.focused?._id).toBe('u1'));

		fire('keyDown', keys.ENTER);
		expect(composer.replaceText).toHaveBeenCalledWith('@alice ', expect.objectContaining({ end: 4 }));
	});

	it('closes the popup on Escape', async () => {
		const { result, fire } = setup('hi @al');
		fire('keyUp', 0);
		await waitFor(() => expect(result.current.option?.trigger).toBe('@'));

		fire('keyUp', keys.ESC);
		expect(result.current.option).toBeUndefined();
	});
});
