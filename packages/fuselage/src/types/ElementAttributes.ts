import type {
	AnchorHTMLAttributes,
	AriaAttributes,
	AriaRole,
	ButtonHTMLAttributes,
	CSSProperties,
	DOMAttributes,
	FieldsetHTMLAttributes,
	ImgHTMLAttributes,
	InputHTMLAttributes,
	LabelHTMLAttributes,
	Ref,
	TextareaHTMLAttributes,
} from 'react';

// The groups without `Web` in their name use no DOM type, so a React Native build of a part keeps them and replaces
// only the `Web…` groups: its handlers take its own events and its `ref` points at its own host view.

/** The `data-*` attributes tests and the app select elements by. */
export type TestAttributes = {
	'data-qa'?: string;
	'data-qa-id'?: string;
	'data-qa-type'?: string;
	'data-testid'?: string;
};

/** What any part forwards on every platform besides its own variations. */
export type CommonAttributes = TestAttributes & {
	id?: string;
};

/** The role, focus order and ARIA states of the button and link roles. */
export type ActionAccessibilityAttributes = {
	role?: AriaRole;
	tabIndex?: number;
} & Pick<
	AriaAttributes,
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
>;

/**
 * What any part forwards on the web besides `CommonAttributes`. No `style`: zero-runtime can't lower a style object it
 * doesn't know at build time onto a frame.
 */
export type WebAttributes<TElement extends Element> = {
	/** Joined after the part's own `rcx-*` classes. */
	className?: string;
	title?: string;
	ref?: Ref<TElement>;
};

/**
 * The DOM handlers react-aria's press, focus, hover, keyboard and long-press hooks hand to an interactive element, so a
 * part that forwards them still works as a trigger. The key list builds both the type and `pickWebPressHandlers`.
 */
export const webPressHandlerKeys = [
	'onClick',
	'onContextMenu',
	'onDragStart',
	'onKeyDown',
	'onKeyUp',
	'onMouseDown',
	'onMouseEnter',
	'onMouseLeave',
	'onMouseUp',
	'onPointerDown',
	'onPointerEnter',
	'onPointerLeave',
	'onPointerUp',
	'onTouchCancel',
	'onTouchEnd',
	'onTouchMove',
	'onTouchStart',
	'onFocus',
	'onBlur',
] as const;

export type WebPressHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webPressHandlerKeys)[number]>;

/**
 * What a row of a list, an option or a menu item listens to: the press handlers plus the pointer move and the
 * capture-phase click a listbox option and react-aria's `useMenuItem` hand it. The key list builds both the type and
 * `pickWebRowHandlers`.
 */
export const webRowHandlerKeys = [...webPressHandlerKeys, 'onPointerMove', 'onClickCapture'] as const;

export type WebRowHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webRowHandlerKeys)[number]>;

/**
 * What a text control listens to: the ones forms and consumers pass an `input` or a `textarea`, composition and the
 * drag events of a textarea that takes dropped files. The key list builds both the type and `pickWebTextInputHandlers`.
 */
export const webTextInputHandlerKeys = [
	'onChange',
	'onInput',
	'onBlur',
	'onFocus',
	'onKeyDown',
	'onKeyUp',
	'onPaste',
	'onClick',
	'onSelect',
	'onCompositionStart',
	'onCompositionUpdate',
	'onCompositionEnd',
	'onDragEnter',
	'onDragLeave',
	'onDragOver',
	'onDrop',
] as const;

export type WebTextInputHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webTextInputHandlerKeys)[number]>;

/** The drop-target handlers of a part a file can be dragged onto, such as a button. */
export const webDropHandlerKeys = ['onDragOver', 'onDrop'] as const;

export type WebDropHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webDropHandlerKeys)[number]>;

/** The drop handlers of a part rendered as a `button` or, through `is`, as an `a`. */
export type ButtonOrAnchorDropHandlers = WebDropHandlers<HTMLButtonElement | HTMLAnchorElement>;

/** What a toolbar container listens to: its own click and the capture-phase keyboard and focus events. */
export const webCaptureHandlerKeys = ['onClick', 'onKeyDownCapture', 'onFocusCapture', 'onBlurCapture'] as const;

export type WebCaptureHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webCaptureHandlerKeys)[number]>;

/** What `AnimatedVisibility` patches onto its child to follow the end of its animation. The key list builds both the type and `pickWebAnimationHandlers`. */
export const webAnimationHandlerKeys = ['onAnimationEnd'] as const;

export type WebAnimationHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webAnimationHandlerKeys)[number]>;

/** The `style` keys `usePosition` returns: the only inline style a part accepts, from the `Position` that places it. */
export const positionStyleKeys = ['position', 'top', 'left', 'bottom', 'zIndex', 'opacity', 'visibility', 'overflowY'] as const;

export type PositionStyle = Pick<CSSProperties, (typeof positionStyleKeys)[number]>;

/** Where a placed part sits relative to its anchor, as `usePosition` resolves it. */
export type Placement =
	'top-start' | 'top-middle' | 'top-end' | 'bottom-start' | 'bottom-middle' | 'bottom-end' | 'top' | 'left' | 'bottom' | 'right';

/** What `Position` hands the part it places, which is the one exception to a part taking no `style`. */
export type PositionedAttributes = {
	style?: PositionStyle;
	placement?: Placement | null;
};

/** What a part that renders an `img` forwards to it besides its own `className`. */
export type ImageAttributes = Pick<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'onLoad' | 'onError'>;

/** The `ref` of a part's `button` branch and of its `a` branch, for casting the flat `ButtonOrAnchorAttributes` ref. */
export type ButtonRef = Ref<HTMLButtonElement>;
export type AnchorRef = Ref<HTMLAnchorElement>;

/** The `ref` of a part rendered as an `li`, a `label`, an `input` or a `textarea`, for casting a ref typed for several tags. */
export type LiRef = Ref<HTMLLIElement>;
export type LabelRef = Ref<HTMLLabelElement>;
export type InputRef = Ref<HTMLInputElement>;
export type TextAreaRef = Ref<HTMLTextAreaElement>;

/** What a part that only shows something forwards. */
export type PartAttributes<TElement extends Element> = CommonAttributes & WebAttributes<TElement>;

/** What a part that only shows something and renders a `span` forwards. */
export type SpanAttributes = PartAttributes<HTMLSpanElement>;

/** What a part that acts when pressed (a button, a link, a dismissable chip) forwards. */
export type ActionAttributes<TElement extends Element> = CommonAttributes &
	ActionAccessibilityAttributes &
	WebAttributes<TElement> &
	WebPressHandlers<TElement>;

/** What a part that is always a `button` forwards: its action attributes and its form name, value and disabled state. */
export type ButtonActionAttributes = ActionAttributes<HTMLButtonElement> &
	Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'name' | 'value' | 'disabled'>;

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
export type InputAttributes = CommonAttributes &
	Omit<WebAttributes<HTMLInputElement>, 'className'> &
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
	>;

/** What a part rendered as an `input` or a `textarea` forwards to the control besides its handlers, `ref` and ARIA attributes. */
export type TextControlAttributes = Pick<
	InputHTMLAttributes<HTMLInputElement>,
	| 'name'
	| 'value'
	| 'defaultValue'
	| 'placeholder'
	| 'autoComplete'
	| 'autoFocus'
	| 'disabled'
	| 'readOnly'
	| 'required'
	| 'min'
	| 'max'
	| 'step'
	| 'minLength'
	| 'maxLength'
	| 'pattern'
	| 'inputMode'
	| 'spellCheck'
	| 'multiple'
	| 'accept'
	| 'list'
	| 'form'
	| 'tabIndex'
	| 'inert'
> &
	Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'>;

/** What a part rendered as a `label` forwards: the control it names. */
export type LabelAttributes = Pick<LabelHTMLAttributes<HTMLLabelElement>, 'htmlFor'>;

/** What a part rendered as a `fieldset` forwards: the form it belongs to and the disabled state it hands its controls. */
export type FieldsetAttributes = Pick<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'disabled' | 'form' | 'name'>;

/**
 * What a part rendered as a `span`, or as an `a` when it has an `href`, forwards: its action attributes and the link's
 * address. The `ref` is typed for both tags; the `a` branch casts it to `AnchorRef`.
 */
export type SpanOrAnchorAttributes = ActionAttributes<HTMLElement> &
	Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'>;

/** What a part rendered as a `div` that only shows something forwards. */
export type DivAttributes = PartAttributes<HTMLDivElement>;

/** The element of a `div` part, for a ref the part measures its own size through. */
export type DivElement = HTMLDivElement;

/** The press handlers of a part rendered as a `div`. */
export type DivPressHandlers = WebPressHandlers<HTMLDivElement>;

/** What a part rendered as a `section` that only shows something forwards. */
export type SectionAttributes = PartAttributes<HTMLElement>;

/** The element of a `section` part, for a ref the part measures its own size through. */
export type SectionElement = HTMLElement;

/** What a toolbar rendered as a `div` listens to. */
export type DivCaptureHandlers = WebCaptureHandlers<HTMLDivElement>;

/** What a part rendered as an `hr`, or as a `div` when it has a label, forwards. The `ref` is typed for both tags; each branch casts it to `HrRef` or `DivRef`. */
export type SeparatorAttributes = PartAttributes<HTMLElement>;
export type HrRef = Ref<HTMLHRElement>;
export type DivRef = Ref<HTMLDivElement>;

/** What a part that only shows something and renders an `svg` forwards. */
export type SvgAttributes = PartAttributes<SVGSVGElement>;

/** What `AnimatedVisibility` patches onto a part rendered as a `div`. */
export type DivAnimationHandlers = WebAnimationHandlers<HTMLDivElement>;

/** What a part rendered as a `pre` that only shows something forwards. */
export type PreAttributes = PartAttributes<HTMLPreElement>;

/** What a part rendered as a `div` that acts when pressed forwards. */
export type DivActionAttributes = ActionAttributes<HTMLDivElement>;

/** What a part rendered as a `figure`, or another plain element, that acts when pressed forwards. */
export type ElementActionAttributes = ActionAttributes<HTMLElement>;

/** What a part that renders an `img` forwards, with its image attributes. */
export type ImageActionAttributes = ActionAttributes<HTMLImageElement> & ImageAttributes;
