import type { AnchorHTMLAttributes, HTMLAttributes, MouseEvent, Ref } from 'react';

import type { WebInteractionHandlers } from '../helpers/pickWebInteractionHandlers';

/** The `data-*` attributes tests and the app select elements by. */
export type WebDataAttributes = {
	[name: `data-${string}`]: string | number | boolean | undefined;
};

/** What any part takes on the web besides its contract; it takes no `style`. */
export type WebAttributes<TElement extends Element> = WebDataAttributes & {
	id?: string;
	/** Joined after the part's own classes. */
	className?: string;
	ref?: Ref<TElement>;
};

/** The address of a part rendered as a link. */
export type WebLinkAttributes = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'rel'>;

/** The closed set of tags a part can render as. */
export type WebTagAttributes<TTag extends keyof HTMLElementTagNameMap> = {
	is?: TTag;
};

export type WebPressAlias<TElement extends Element> = {
	/** @deprecated Use `onPress`. */
	onClick?: (event: MouseEvent<TElement>) => void;
};

/** A contract as the web renderer takes it: its `ref` points at the element, and the web attributes are added. */
export type WebProps<TContract, TElement extends Element> = Omit<TContract, 'ref'> & WebAttributes<TElement>;

/**
 * A contract as a web renderer that is one plain element takes it: the deprecated press alias, the handlers a trigger or
 * a tooltip hands the element, and its title and focus order.
 */
export type WebElementProps<TContract, TElement extends HTMLElement> = WebProps<TContract, TElement> &
	WebPressAlias<TElement> &
	WebInteractionHandlers<TElement> &
	Pick<HTMLAttributes<TElement>, 'title' | 'tabIndex'>;

/** `WebElementProps` of a part that is always a `div`, named here so a frame module names no DOM type. */
export type WebDivProps<TContract> = WebElementProps<TContract, HTMLDivElement>;

/** `WebElementProps` of a part that is always a `span`. */
export type WebSpanProps<TContract> = WebElementProps<TContract, HTMLSpanElement>;
