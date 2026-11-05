import { act, renderHook } from '@testing-library/react';

import { useComposerBoxPopup } from './useComposerBoxPopup';
import type { ComposerPopupOption } from '../../contexts/ComposerPopupContext';

type Item = { _id: string };

let composerText = '';
let popupItems: Item[] = [];

jest.mock('../../contexts/ChatContext', () => ({
	useChat: () => ({
		composer: {
			substring: (start: number, end?: number) => composerText.substring(start, end),
			get selection() {
				return { start: composerText.length, end: composerText.length };
			},
		},
	}),
}));

jest.mock('./useComposerBoxPopupQueries', () => ({
	useComposerBoxPopupQueries: () => ({ queries: [{ isSuccess: true, data: popupItems }], suspended: false }),
}));

const emojiOption = {
	trigger: ':',
	prefix: '',
	triggerLength: 2,
	triggerAnywhere: true,
	getValue: (item: Item) => item._id,
} as unknown as ComposerPopupOption<Item>;

const setup = (text: string, items: Item[]) => {
	composerText = text;
	popupItems = items;

	const input = document.createElement('textarea');
	const { result } = renderHook(() => useComposerBoxPopup<Item>([emojiOption]));

	act(() => {
		result.current.callbackRef(input);
	});

	act(() => {
		input.dispatchEvent(new KeyboardEvent('keyup', { key: ')', bubbles: true }));
	});

	const pressArrow = (key: 'ArrowUp' | 'ArrowDown') => {
		const event = new KeyboardEvent('keydown', {
			key,
			keyCode: key === 'ArrowUp' ? 38 : 40,
			which: key === 'ArrowUp' ? 38 : 40,
			bubbles: true,
			cancelable: true,
		});
		act(() => {
			input.dispatchEvent(event);
		});
		return event;
	};

	return { result, pressArrow };
};

describe('useComposerBoxPopup', () => {
	it.each(['ArrowUp', 'ArrowDown'] as const)('lets %s move the caret when the popup has no items', (key) => {
		const { result, pressArrow } = setup('first line :)', []);

		expect(result.current.option).toBe(emojiOption);
		expect(pressArrow(key).defaultPrevented).toBe(false);
	});

	it.each(['ArrowUp', 'ArrowDown'] as const)('keeps %s for moving through the popup items', (key) => {
		const { pressArrow } = setup('first line :sm', [{ _id: 'smile' }, { _id: 'smirk' }]);

		expect(pressArrow(key).defaultPrevented).toBe(true);
	});
});
