import { after, before, describe, it, mock } from 'node:test';

import { renderHook, act } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import { useState, type ReactNode } from 'react';

import { enterModuleScope, leaveModuleScope } from '../../../tests/mocks/moduleScope';

let EmojiPickerProvider: (typeof import('./EmojiPickerProvider'))['default'];
let usePreviewEmoji: (typeof import('../../contexts/EmojiPickerContext'))['usePreviewEmoji'];

const wrapper = ({ children }: { children: ReactNode }) => <EmojiPickerProvider>{children}</EmojiPickerProvider>;

describe('EmojiPickerProvider', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/fuselage-hooks'), {
			exports: {
				default: (() => {
					const originalModule = require('@rocket.chat/fuselage-hooks');

					return {
						...originalModule,
						useDebouncedState: <T,>(initialValue: T) => useState<T>(initialValue),
						useLocalStorage: <T,>(_: string, initialValue: T) => useState<T>(initialValue),
						useStableCallback: (callback: (...args: any[]) => unknown) => callback,
					};
				})(),
			},
		});
		mock.module('../../lib/emoji', {
			exports: {
				emoji: { packages: { base: { emojisByCategory: { recent: [] } } } },
				getFrequentEmoji: fn<FunctionLike>(() => []),

				createEmojiListByCategorySubscription: fn<FunctionLike>(() => {
					const snapshot = [[], {}];
					return [() => () => undefined, () => snapshot];
				}),
			},
		});
		mock.module('../../views/composer/EmojiPicker', {
			exports: {
				default: (
					() => () =>
						null
				)(),
			},
		});
		mock.module('./useUpdateCustomEmoji', {
			exports: {
				useUpdateCustomEmoji: () => undefined,
			},
		});
		({ default: EmojiPickerProvider } = require('./EmojiPickerProvider'));
		({ usePreviewEmoji } = require('../../contexts/EmojiPickerContext'));
	});

	after(leaveModuleScope);
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
