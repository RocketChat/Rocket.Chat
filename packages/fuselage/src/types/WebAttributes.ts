import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, MouseEvent, Ref } from 'react';

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
 * A contract as a web renderer built on a native `input` takes it: what forms (react-hook-form's `register` and `field`
 * included) and field labels hand an input reaches the input, and `className` goes on the part's root.
 */
export type WebInputProps<TContract> = WebProps<TContract, HTMLInputElement> &
	Pick<
		InputHTMLAttributes<HTMLInputElement>,
		| 'title'
		| 'name'
		| 'value'
		| 'readOnly'
		| 'required'
		| 'autoFocus'
		| 'tabIndex'
		| 'inert'
		| 'onChange'
		| 'onBlur'
		| 'onFocus'
		| 'onClick'
		| 'onKeyDown'
	>;

/**
 * A contract as a web renderer that is always a `button` takes it: the deprecated press alias, the handlers a trigger
 * hands it, and the button's title, focus order and form name and value.
 */
export type WebButtonProps<TContract> = WebProps<TContract, HTMLButtonElement> &
	WebPressAlias<HTMLButtonElement> &
	WebInteractionHandlers<HTMLButtonElement> &
	Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'name' | 'value' | 'tabIndex'>;

/** A contract as a web renderer that is always a `span` and only shows something takes it. */
export type WebSpanProps<TContract> = WebProps<TContract, HTMLSpanElement> & {
	title?: string;
};
