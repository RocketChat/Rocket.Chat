import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

type Labelled = Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'>;

export type ContextualbarContract = CommonAttributes &
	PressEvents &
	Labelled & {
		role?: AriaRole;
		tabIndex?: number;
		children?: ReactNode;
		/** Makes the bar as wide as its container, as when it is positioned over the room. */
		stretch?: boolean;
		/** How the bar is placed: in the flow beside the room, or over it. */
		position?: 'static' | 'relative' | 'absolute' | 'fixed';
	};

export type ContextualbarHeaderContract = CommonAttributes & Labelled & { children?: ReactNode };

export type ContextualbarContentContract = CommonAttributes &
	Labelled & {
		children?: ReactNode;
		/** Drops the inline padding, for content such as a list whose items bring their own. */
		flush?: boolean;
		/** Adds a 12px block padding, so the first and last items keep clear of the header and footer. */
		spaced?: boolean;
	};

export type ContextualbarSectionContract = CommonAttributes & Labelled & { children?: ReactNode };

export type ContextualbarFooterContract = CommonAttributes & Labelled & { children?: ReactNode };

export type ContextualbarTitleContract = CommonAttributes &
	Labelled & {
		children?: ReactNode;
		/** Sanitized markup for the title, in place of `children`. */
		dangerouslySetInnerHTML?: { __html: string };
	};
