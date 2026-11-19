import type { AnchorHTMLAttributes, FieldsetHTMLAttributes, LabelHTMLAttributes, Ref } from 'react';

import type { WebPressAlias, WebProps } from './WebAttributes';
import type { WebInteractionHandlers } from '../helpers/pickWebInteractionHandlers';

// What each kind of element takes on the web besides a part's contract, named here so the module of a frame names no
// DOM type.

/**
 * A contract as a web renderer that only shows something takes it: the deprecated press alias, the handlers a trigger
 * hands it and its tooltip.
 */
export type WebPartProps<TContract, TElement extends Element = HTMLElement> = WebProps<TContract, TElement> &
	WebPressAlias<TElement> &
	WebInteractionHandlers<TElement> & {
		title?: string;
	};

export type WebDivProps<TContract> = WebPartProps<TContract, HTMLDivElement>;
export type WebSpanProps<TContract> = WebPartProps<TContract, HTMLSpanElement>;

/** A contract as a web renderer that is a `label`, or a `span` where a label cannot be, takes it: the control it names. */
export type WebLabelProps<TContract> = WebPartProps<TContract> &
	Pick<LabelHTMLAttributes<HTMLLabelElement>, 'htmlFor'> & {
		/** Renders a `span` instead of the `label`, or the `legend` of a `fieldset`. A label inside another label is always a `span`. */
		is?: 'label' | 'span' | 'legend';
	};

/** A contract as a web renderer that is always an `a` takes it: where it points. */
export type WebAnchorProps<TContract> = WebPartProps<TContract, HTMLAnchorElement> &
	Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel' | 'download'>;

/** A contract as a web renderer that is a `fieldset` takes it: the form it belongs to and its name there. */
export type WebFieldsetProps<TContract> = WebPartProps<TContract, HTMLFieldSetElement> &
	Pick<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'form' | 'name'>;

/** The `ref` of the `label` branch of a part that renders more than one tag, for casting a ref typed for all of them. */
export type WebLabelRef = Ref<HTMLLabelElement>;

/** The `ref` of the `legend` branch of a label, for casting a ref typed for all of its tags. */
export type WebLegendRef = Ref<HTMLLegendElement>;
