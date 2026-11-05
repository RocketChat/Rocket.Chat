import type { AnchorHTMLAttributes, ButtonHTMLAttributes, DOMAttributes, HTMLAttributes, InputHTMLAttributes, RefAttributes } from 'react';

/**
 * The handlers react-aria's press, focus, hover, keyboard and long-press hooks hand to an interactive element, so a
 * part that forwards them one by one still works as a trigger.
 */
export type PressHandlers<TElement extends Element> = Pick<
	DOMAttributes<TElement>,
	| 'onClick'
	| 'onContextMenu'
	| 'onDragStart'
	| 'onKeyDown'
	| 'onKeyUp'
	| 'onMouseDown'
	| 'onMouseEnter'
	| 'onMouseLeave'
	| 'onMouseUp'
	| 'onPointerDown'
	| 'onPointerEnter'
	| 'onPointerLeave'
	| 'onPointerUp'
	| 'onTouchCancel'
	| 'onTouchEnd'
	| 'onTouchMove'
	| 'onTouchStart'
	| 'onFocus'
	| 'onBlur'
>;

/** The `data-*` attributes tests and the app select elements by. */
export type TestAttributes = {
	'data-qa'?: string;
	'data-qa-id'?: string;
	'data-qa-type'?: string;
	'data-testid'?: string;
};

/**
 * What any part forwards to its element besides its own variations. No `style`: zero-runtime can't lower a style
 * object it doesn't know at build time onto a frame.
 */
export type CommonAttributes<TElement extends Element> = Pick<HTMLAttributes<TElement>, 'id' | 'title'> & {
	/** Joined after the part's own `rcx-*` classes. */
	className?: string;
};

/**
 * What a part that acts when pressed (a button, a link, a dismissable chip) forwards: the common attributes, the
 * handlers of every trigger hook, the test hooks and the ARIA states the button and link roles take.
 */
export type ActionAttributes<TElement extends Element> = CommonAttributes<TElement> &
	PressHandlers<TElement> &
	TestAttributes &
	Pick<
		HTMLAttributes<TElement>,
		| 'role'
		| 'tabIndex'
		| 'aria-label'
		| 'aria-labelledby'
		| 'aria-describedby'
		| 'aria-controls'
		| 'aria-current'
		| 'aria-disabled'
		| 'aria-expanded'
		| 'aria-haspopup'
		| 'aria-hidden'
		| 'aria-live'
		| 'aria-pressed'
		| 'aria-selected'
	> &
	RefAttributes<TElement>;

/**
 * What a part rendered as a `button` or, through `is`, as an `a` forwards besides its action attributes; each reaches
 * only the element it belongs to. One flat type rather than a union per tag, so the callers' `Omit<…Props, …>` keeps
 * every key.
 */
export type ButtonOrAnchorAttributes = ActionAttributes<HTMLButtonElement | HTMLAnchorElement> &
	Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'form' | 'name' | 'value' | 'autoFocus'> &
	Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'download'>;

/**
 * What a part built on an `input` forwards to it: what forms (react-hook-form's `register` and `field` included) and
 * field labels hand an input, the test hooks and its `ref`. The part's `className` goes on its root instead.
 */
export type InputAttributes = Pick<HTMLAttributes<HTMLInputElement>, 'id' | 'title'> &
	TestAttributes &
	Pick<
		InputHTMLAttributes<HTMLInputElement>,
		| 'name'
		| 'value'
		| 'checked'
		| 'defaultChecked'
		| 'disabled'
		| 'readOnly'
		| 'required'
		| 'autoFocus'
		| 'tabIndex'
		| 'inert'
		| 'aria-label'
		| 'aria-labelledby'
		| 'aria-describedby'
		| 'aria-invalid'
		| 'aria-required'
		| 'aria-hidden'
		| 'onChange'
		| 'onBlur'
		| 'onFocus'
		| 'onClick'
		| 'onKeyDown'
	> &
	RefAttributes<HTMLInputElement>;
