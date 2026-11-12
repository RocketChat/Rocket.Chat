import { lazy } from 'react';

export const EmojiPicker = lazy(() => import('./components/EmojiPicker.js'));
export type { EmojiPickerProps } from './components/EmojiPicker.js';

export { default as EmojiElement } from './components/EmojiElement.js';
export { EmojiPickerContext, useEmojiPicker, usePreviewEmoji, useEmojiPickerData } from './contexts/EmojiPickerContext.js';
export {
	EmojiRegistryContext,
	useEmojiRegistry,
	type EmojiRegistryContextValue,
	type EmojiPackages,
} from './contexts/EmojiRegistryContext.js';
export * from './lib/emoji.js';
export type * from './lib/types.js';
