import type {
	AnchorHTMLAttributes,
	AriaAttributes,
	AriaRole,
	ButtonHTMLAttributes,
	CSSProperties,
	DOMAttributes,
	FieldsetHTMLAttributes,
	FormEventHandler,
	ImgHTMLAttributes,
	InputHTMLAttributes,
	LabelHTMLAttributes,
	Ref,
	TdHTMLAttributes,
	TextareaHTMLAttributes,
	ThHTMLAttributes,
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
export const webRowHandlerKeys = [...webPressHandlerKeys, 'onPointerMove', 'onClickCapture', 'onDragStartCapture'] as const;

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

/** The `style` keys a virtualizer (react-virtuoso) gives the list it renders: the offsets that stand in for the rows it leaves out. */
export const virtualizedListStyleKeys = ['boxSizing', 'marginTop', 'paddingTop', 'paddingBottom', 'visibility'] as const;

/** The `style` key a virtualizer gives each row it renders. */
export const virtualizedItemStyleKeys = ['overflowAnchor'] as const;

export const virtualizerStyleKeys = [...virtualizedListStyleKeys, ...virtualizedItemStyleKeys] as const;

export type VirtualizedListStyle = Pick<CSSProperties, (typeof virtualizedListStyleKeys)[number]>;
export type VirtualizedItemStyle = Pick<CSSProperties, (typeof virtualizedItemStyleKeys)[number]>;
export type VirtualizerStyle = VirtualizedListStyle & VirtualizedItemStyle;

/** What the list a virtualizer renders accepts besides its `data-*`: the offsets the virtualizer computes. The one exception to a part taking no `style`, with Position's. */
export type VirtualizedListAttributes = {
	style?: VirtualizedListStyle;
};

/** What a row a virtualizer renders accepts besides its `data-*` (`data-index`, `data-known-size`, `data-item-index`). */
export type VirtualizedItemAttributes = {
	style?: VirtualizedItemStyle;
};

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

/** The `ref` of a part rendered as a list or a heading, for casting a ref typed for several tags. */
export type UlRef = Ref<HTMLUListElement>;
export type OlRef = Ref<HTMLOListElement>;
export type HeadingRef = Ref<HTMLHeadingElement>;

/** What a part that only shows something forwards. */
export type PartAttributes<TElement extends Element> = CommonAttributes & WebAttributes<TElement>;

/** What a part that only shows something and renders a `span` forwards. */
export type SpanAttributes = PartAttributes<HTMLSpanElement>;

/** What a glyph that only shows something, renders an `i` and may act as a hover or press target forwards. */
export type GlyphAttributes = PartAttributes<HTMLElement> & WebPressHandlers<HTMLElement>;

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
	| 'autoCapitalize'
	| 'autoComplete'
	| 'autoCorrect'
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

/** What a row of a list, an option or a menu item rendered as any element listens to. */
export type ElementRowHandlers = WebRowHandlers<HTMLElement>;

/** What a part that is always an `a` forwards when it acts. */
export type AnchorActionAttributes = ActionAttributes<HTMLAnchorElement>;

/** What a part rendered as an `a` forwards besides its action attributes: where it points. */
export type AnchorLinkAttributes = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'download'>;

/** What a part rendered as a `button` forwards to it besides its action attributes: the form it submits. */
export type ButtonFormAttributes = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'form'>;

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

/** The element of a part rendered as an `input`, and of one rendered as an `input` or a `textarea`. */
export type InputElement = HTMLInputElement;
export type ButtonElement = HTMLButtonElement;
export type TextControlElement = HTMLInputElement | HTMLTextAreaElement;

/** The press handlers of a part rendered as a `span`. */
export type SpanPressHandlers = WebPressHandlers<HTMLSpanElement>;

/** What a part rendered as a `label` that only holds a control forwards. */
export type LabelPartAttributes = PartAttributes<HTMLLabelElement>;

/** What a part rendered as a `fieldset` forwards besides its `FieldsetAttributes`. */
export type FieldsetPartAttributes = PartAttributes<HTMLFieldSetElement> & WebPressHandlers<HTMLFieldSetElement>;

/** What a part rendered as an `a` forwards: its action attributes and the link's address. */
export type AnchorAttributes = ActionAttributes<HTMLAnchorElement> &
	Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'download'>;

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

/** The elements a part reads or measures through a ref it creates, named so a frame's module needs no DOM type. */
export type HtmlElementOf = HTMLElement;
export type OlElement = HTMLOListElement;
export type LabelElement = HTMLLabelElement;

/** What a part rendered as a `ul` that acts when pressed forwards. */
export type UlActionAttributes = ActionAttributes<HTMLUListElement>;

/** What a part rendered as a `div` that acts when pressed forwards. */
export type DivActionAttributes = ActionAttributes<HTMLDivElement>;

/** What a part rendered as a `figure`, or another plain element, that acts when pressed forwards. */
export type ElementActionAttributes = ActionAttributes<HTMLElement>;

/** What a part that renders an `img` forwards, with its image attributes. */
export type ImageActionAttributes = ActionAttributes<HTMLImageElement> & ImageAttributes;

/** What a table cell rendered as a `td` or a `th` forwards besides its part attributes: the cells it spans and the headers it answers to. */
export type TableCellAttributes = Pick<
	TdHTMLAttributes<HTMLTableCellElement> & ThHTMLAttributes<HTMLTableCellElement>,
	'scope' | 'colSpan' | 'rowSpan' | 'headers'
>;

/** What a part that renders a hero `img` forwards: its image attributes and where the picture comes from. */
export type HeroImageAttributes = ImageAttributes & Pick<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'loading'>;

/** What a part rendered as a `form`, or as a `div` when it has no `onSubmit`, forwards: the submit handler and the id a button outside the form points to. */
export type FormSubmitAttributes = {
	onSubmit?: FormEventHandler<HTMLFormElement>;
	id?: string;
};

/** What a part rendered as a `nav` forwards: its part attributes and the name of the landmark. */
export type NavAttributes = PartAttributes<HTMLElement> & Pick<AriaAttributes, 'aria-label'>;
