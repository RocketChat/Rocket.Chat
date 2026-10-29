import { lazy } from 'react';

export const EmojiPicker = lazy(() => import('./EmojiPicker'));
export type { EmojiPickerProps } from './EmojiPicker/EmojiPicker';

export { default as EmojiElement } from './EmojiPicker/EmojiElement';
export { EmojiPickerContext, useEmojiPicker, usePreviewEmoji, useEmojiPickerData } from './contexts/EmojiPickerContext';
export {
	EmojiRegistryContext,
	useEmojiRegistry,
	type EmojiRegistryContextValue,
	type EmojiPackages,
} from './contexts/EmojiRegistryContext';
export * from './lib/emoji';
export type * from './lib/types';
