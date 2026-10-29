import { lazy } from 'react';

export const EmojiPicker = lazy(() => import('./components/EmojiPicker'));
export type { EmojiPickerProps } from './components/EmojiPicker';

export { default as EmojiElement } from './components/EmojiElement';
export { EmojiPickerContext, useEmojiPicker, usePreviewEmoji, useEmojiPickerData } from './contexts/EmojiPickerContext';
export {
	EmojiRegistryContext,
	useEmojiRegistry,
	type EmojiRegistryContextValue,
	type EmojiPackages,
} from './contexts/EmojiRegistryContext';
export * from './lib/emoji';
export type * from './lib/types';
