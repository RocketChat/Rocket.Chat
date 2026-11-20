import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, Ref } from 'react';

import type { WebInteractionHandlers } from '../helpers/pickWebInteractionHandlers';

/** The `data-*` attributes tests and the app select elements by. */
export type WebDataAttributes = {
	[name: `data-${string}`]: string | number | boolean | undefined;
};

/** What any part takes on the web besides its contract. No `style`: a frame cannot take one it does not know at build time. */
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
 * A contract as a web renderer that is always a `button` takes it: the deprecated press alias, the handlers a trigger
 * hands it, and the button's title, focus order and form name and value.
 */
export type WebButtonProps<TContract> = WebProps<TContract, HTMLButtonElement> &
	WebPressAlias<HTMLButtonElement> &
	WebInteractionHandlers<HTMLButtonElement> &
	Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'name' | 'value' | 'tabIndex'>;

/** A contract as a web renderer that is always a `div` takes it: the web attributes and the title. */
export type WebDivProps<TContract> = WebProps<TContract, HTMLDivElement> & { title?: string };

/** The deprecated press alias of a `div` whose contract declares `onPress`. */
export type WebDivPressAlias = WebPressAlias<HTMLDivElement>;
