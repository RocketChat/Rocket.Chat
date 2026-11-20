import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes } from 'react';

import type { WebLinkAttributes, WebPressAlias, WebProps } from './WebAttributes';
import type { WebInteractionHandlers } from '../helpers/pickWebInteractionHandlers';

// A frame module names no DOM type, so the props of each element a part renders are bound here.

/**
 * A container contract as the web renders it: besides the web attributes it takes the handlers a consumer hangs on a
 * region to follow the pointer, the focus and the keys inside it. A container has no press of its own, so `onClick` is
 * the plain DOM handler here and not an alias of `onPress`.
 */
type WebContainerProps<TContract, TElement extends Element> = WebProps<TContract, TElement> &
	WebInteractionHandlers<TElement> &
	Pick<HTMLAttributes<TElement>, 'title' | 'tabIndex' | 'onClick'>;

export type WebDivProps<TContract> = WebContainerProps<TContract, HTMLDivElement>;
export type WebSpanProps<TContract> = WebContainerProps<TContract, HTMLSpanElement>;
/** For the sectioning elements, which have no interface of their own: `nav`, `footer`, `section`. */
export type WebSectionProps<TContract> = WebContainerProps<TContract, HTMLElement>;

/** A pressable `div`: its press comes through `onPress`, with `onClick` as the deprecated alias. */
export type WebPressableDivProps<TContract> = WebProps<TContract, HTMLDivElement> &
	WebPressAlias<HTMLDivElement> &
	WebInteractionHandlers<HTMLDivElement> &
	Pick<HTMLAttributes<HTMLDivElement>, 'tabIndex'>;

/** An action contract rendered as an `a`: where it goes, the press alias and the handlers a trigger hands it. */
export type WebAnchorProps<TContract> = WebProps<TContract, HTMLAnchorElement> &
	WebLinkAttributes &
	WebPressAlias<HTMLAnchorElement> &
	WebInteractionHandlers<HTMLAnchorElement> &
	Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'download' | 'title' | 'tabIndex'>;

/** An action contract rendered as a `button`: the press alias, the handlers a trigger hands it, and its form name and value. */
export type WebButtonProps<TContract> = WebProps<TContract, HTMLButtonElement> &
	WebPressAlias<HTMLButtonElement> &
	WebInteractionHandlers<HTMLButtonElement> &
	Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'name' | 'value' | 'tabIndex' | 'disabled'>;
