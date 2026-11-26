import type {
	AnchorHTMLAttributes,
	ButtonHTMLAttributes,
	DOMAttributes,
	HTMLAttributes,
	InputHTMLAttributes,
	MouseEventHandler,
	Ref,
} from 'react';

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
	onClick?: MouseEventHandler<TElement>;
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

/**
 * A contract as a web renderer that is a `button` or, through `is`, an `a` takes it: the deprecated press alias, the
 * handlers a trigger hands it and the attributes of each tag, which reach only the element they belong to.
 */
export type WebButtonOrLinkProps<TContract> = WebProps<TContract, HTMLButtonElement | HTMLAnchorElement> &
	WebTagAttributes<'button' | 'a'> &
	WebLinkAttributes &
	WebPressAlias<HTMLButtonElement | HTMLAnchorElement> &
	WebInteractionHandlers<HTMLButtonElement | HTMLAnchorElement> &
	Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'title' | 'name' | 'value' | 'tabIndex' | 'type' | 'form' | 'autoFocus'> &
	Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'download'> & {
		/** Opens the link in a new tab, without giving it access to this page. */
		external?: boolean;
	};

/** The handlers of a part a file can be dropped on, such as the button of a file upload control. */
export type WebDropTargetProps = Pick<DOMAttributes<HTMLButtonElement | HTMLAnchorElement>, 'onDragOver' | 'onDrop'>;

/** The `ref` of each branch of a part that renders a `button` or an `a`, whose props type one `ref` for both. */
export type WebButtonRef = Ref<HTMLButtonElement>;
export type WebLinkRef = Ref<HTMLAnchorElement>;

/**
 * A contract as a web renderer that is a `span` or, with an `href`, an `a` takes it: the deprecated press alias and the
 * attributes of the link, which reach only the `a`.
 */
export type WebSpanOrLinkProps<TContract> = WebProps<TContract, HTMLSpanElement | HTMLAnchorElement> &
	WebPressAlias<HTMLSpanElement | HTMLAnchorElement> &
	WebLinkAttributes &
	Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'target'> & {
		title?: string;
		tabIndex?: number;
	};

/**
 * A contract as a web renderer that is a `div` grouping other parts takes it: its title, and what a toolbar listens to
 * on its group, its own click and the capture-phase keyboard and focus events.
 */
export type WebGroupProps<TContract> = WebProps<TContract, HTMLDivElement> & {
	title?: string;
} & Pick<DOMAttributes<HTMLDivElement>, 'onClick' | 'onKeyDownCapture' | 'onFocusCapture' | 'onBlurCapture'>;

/** The deprecated press alias of a `div` whose contract declares `onPress`. */
export type WebDivPressAlias = WebPressAlias<HTMLDivElement>;

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
