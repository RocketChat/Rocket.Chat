import type { Keys as IconName } from '@rocket.chat/icons';
import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type CalloutContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-live'> &
	PressEvents & {
		role?: AriaRole;
		type?: 'info' | 'success' | 'warning' | 'danger';
		title?: ReactNode;
		children?: ReactNode;
		icon?: IconName;
		actions?: ReactNode;
	};
