import { usePreviewEmoji, useEmojiPickerData } from '@rocket.chat/ui-emoji-picker';
import { renderHook, act } from '@testing-library/react';
import { useState, type ReactNode } from 'react';

import EmojiPickerProvider from './EmojiPickerProvider';

jest.mock('@rocket.chat/fuselage-hooks', () => {
	const originalModule = jest.requireActual('@rocket.chat/fuselage-hooks');

	return {
		...originalModule,
		useDebouncedState: <T,>(initialValue: T) => useState<T>(initialValue),
		useLocalStorage: <T,>(_: string, initialValue: T) => useState<T>(initialValue),
		useStableCallback: (callback: (...args: any[]) => unknown) => callback,
	};
});

jest.mock('../../lib/emoji', () => ({
	emoji: { packages: { base: { emojisByCategory: { recent: [] } } } },
	getFrequentEmoji: jest.fn((names: string[]) => names.map((emoji) => ({ emoji, image: `image://${emoji}` }))),
	createEmojiListByCategorySubscription: jest.fn(() => {
		const snapshot = [[], {}];
		return [() => () => undefined, () => snapshot];
	}),
}));

jest.mock('@rocket.chat/ui-emoji-picker', () => ({
	...jest.requireActual('@rocket.chat/ui-emoji-picker'),
	EmojiPicker: () => null,
}));
jest.mock('./useUpdateCustomEmoji', () => ({ useUpdateCustomEmoji: () => undefined }));

const wrapper = ({ children }: { children: ReactNode }) => <EmojiPickerProvider>{children}</EmojiPickerProvider>;

describe('EmojiPickerProvider', () => {
	it('should keep the same preview reference when receiving the same emoji and name', () => {
		const { result } = renderHook(() => usePreviewEmoji(), { wrapper });

		act(() => {
			result.current.handlePreview('image://smile', 'smile');
		});

		const firstPreview = result.current.emojiToPreview;
		expect(firstPreview).toEqual({ emoji: 'image://smile', name: 'smile' });

		act(() => {
			result.current.handlePreview('image://smile', 'smile');
		});

		expect(result.current.emojiToPreview).toBe(firstPreview);

		act(() => {
			result.current.handlePreview('image://rocket', 'rocket');
		});

		expect(result.current.emojiToPreview).toEqual({ emoji: 'image://rocket', name: 'rocket' });
		expect(result.current.emojiToPreview).not.toBe(firstPreview);
	});

	it('counts an emoji as frequent, ranking the quick reactions, without adding it to the recent list', () => {
		const { result } = renderHook(() => useEmojiPickerData(), { wrapper });

		act(() => result.current.addFrequentEmoji('smile'));
		act(() => result.current.addFrequentEmoji('rocket'));
		act(() => result.current.addFrequentEmoji('smile'));

		expect(result.current.quickReactions.map(({ emoji }) => emoji)).toEqual(['smile', 'rocket']);
		expect(result.current.recentEmojis).toEqual([]);
	});

	it('counts an emoji as frequent and as recent when it is picked', () => {
		const { result } = renderHook(() => useEmojiPickerData(), { wrapper });

		act(() => result.current.addRecentEmoji('tada'));

		expect(result.current.quickReactions.map(({ emoji }) => emoji)).toEqual(['tada']);
		expect(result.current.recentEmojis).toEqual(['tada']);
	});
});
