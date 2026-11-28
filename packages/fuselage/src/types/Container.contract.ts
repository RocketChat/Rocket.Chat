import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes } from './Attributes.contract';

/** The role and the ARIA attributes of a part that groups others: a bar, a region, a list. */
export type ContainerAccessibilityAttributes = {
	role?: AriaRole;
} & Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden' | 'aria-live' | 'aria-busy'>;

/** The contract of a part that lays out and paints what it holds, and does nothing when pressed. */
export type ContainerContract = CommonAttributes &
	ContainerAccessibilityAttributes & {
		children?: ReactNode;
	};
