import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes, PressEvents } from './Attributes.contract';

/** The role and the ARIA naming of a part that only shows something. */
export type DisplayAccessibilityAttributes = {
	role?: AriaRole;
} & Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden' | 'aria-live'>;

/** The contract of a part that only shows something: a label, a hint, a row of a form. */
export type DisplayContract = CommonAttributes &
	DisplayAccessibilityAttributes &
	PressEvents & {
		children?: ReactNode;
	};
