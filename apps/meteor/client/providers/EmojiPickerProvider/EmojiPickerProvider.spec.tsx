import { renderHook, act } from '@testing-library/react';
import { useState, type ReactNode } from 'react';

import EmojiPickerProvider from './EmojiPickerProvider';
import { usePreviewEmoji } from '../../contexts/EmojiPickerContext';

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
	getFrequentEmoji: jest.fn(() => []),
	createEmojiListByCategorySubscription: jest.fn(() => {
		const snapshot = [[], {}];
		return [() => () => undefined, () => snapshot];
	}),
}));

jest.mock('../../views/composer/EmojiPicker', () => () => null);
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
});
