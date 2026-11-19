import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type BadgeContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-hidden' | 'aria-live'> & {
		variant?: 'secondary' | 'primary' | 'danger' | 'warning';
		small?: boolean;
		children?: ReactNode;
		role?: AriaRole;
	};
