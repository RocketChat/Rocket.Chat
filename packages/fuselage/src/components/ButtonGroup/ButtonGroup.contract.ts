import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type ButtonGroupContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-orientation'> & {
		/** A toolbar takes the group over with its own role. */
		role?: AriaRole;
		align?: 'start' | 'center' | 'end';
		/** `equal` also gives every button the same width. */
		stretch?: boolean | 'equal';
		wrap?: boolean;
		vertical?: boolean;
		small?: boolean;
		large?: boolean;
		children?: ReactNode;
	};
