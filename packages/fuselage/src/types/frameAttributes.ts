import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from 'react';

// The HTML attributes Fuselage's parts forward to the element a frame renders, besides the few Tamagui's frame types
// already take (`id`, `name`, `tabIndex`, `target`, `htmlFor`, `disabled`). The handlers and ARIA attributes it does
// type, it types for a `div` or for React Native: a merged declaration can't retype them, so `frameProps` does.
type FrameAttributes = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'title' | 'href' | 'rel' | 'download'> &
	Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'form' | 'value' | 'autoFocus'> &
	Pick<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'defaultChecked' | 'readOnly' | 'required'> &
	Pick<HTMLAttributes<HTMLElement>, 'inert'>;

declare module '@tamagui/web' {
	interface StackNonStyleProps extends FrameAttributes {}
	interface TextNonStyleProps extends FrameAttributes {}
}
