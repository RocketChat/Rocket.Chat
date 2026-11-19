import type { Ref } from 'react';

import type { WebPressAlias, WebProps } from './WebAttributes';

// A contract as the web renderer of a part that only shows something takes it, by the element the part always renders.
// A frame module names one of these instead of the DOM element type, which it must not import.

type WebTitle = {
	title?: string;
};

export type WebDivProps<TContract> = WebProps<TContract, HTMLDivElement> & WebTitle;

export type WebSpanProps<TContract> = WebProps<TContract, HTMLSpanElement> & WebTitle;

export type WebPreProps<TContract> = WebProps<TContract, HTMLPreElement> & WebTitle;

export type WebSvgProps<TContract> = WebProps<TContract, SVGSVGElement> & WebTitle;

/** For a part rendered as a sectioning or grouping element that has no element type of its own, such as `section` or `figure`. */
export type WebElementProps<TContract> = WebProps<TContract, HTMLElement> & WebTitle;

/** The `ref` of each branch of a part that renders one of two elements, for casting the ref its props type for both. */
export type WebHrRef = Ref<HTMLHRElement>;
export type WebDivRef = Ref<HTMLDivElement>;

/** A `section` that can be pressed and whose `title` is its own content, not the attribute. */
export type WebSectionProps<TContract> = WebProps<TContract, HTMLElement> & WebPressAlias<HTMLElement>;

/** The element of a `section` part, for a ref the part measures its own size through. */
export type WebSectionElement = HTMLElement;
