import type { AriaAttributes, ReactNode } from 'react';

import type { ActionContract, CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type TabsContract = CommonAttributes &
	PressEvents &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'> & {
		children?: ReactNode;
		divider?: boolean;
		/** Grows the items to fill the whole width. */
		stretch?: boolean;
	};

export type TabsItemContract = ActionContract & {
	children?: ReactNode;
	selected?: boolean;
	disabled?: boolean;
};
