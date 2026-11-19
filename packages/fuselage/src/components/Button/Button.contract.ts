import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode } from 'react';

import type { ActionContract } from '../../types/Attributes.contract';

export type ButtonContract = ActionContract & {
	children?: ReactNode;
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'secondary-danger' | 'secondary-warning' | 'secondary-success';
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large';
	disabled?: boolean;
	/** Swaps the icon for a spinner and disables the button. */
	loading?: boolean;
	square?: boolean;
	/** Lowers the minimum width so a label of one or two characters fits. */
	compact?: boolean;
	icon?: IconName;
};
