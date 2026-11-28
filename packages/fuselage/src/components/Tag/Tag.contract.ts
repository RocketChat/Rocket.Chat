import type { ReactNode } from 'react';

import type { ActionContract } from '../../types/Attributes.contract';

export type TagContract = ActionContract & {
	medium?: boolean;
	large?: boolean;
	/** Fully rounded shape. Use for interactive tags such as filters. */
	pill?: boolean;
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'secondary-danger' | 'secondary-warning' | 'secondary-info' | 'featured';
	/** Renders the disabled look; the tag still answers a press. */
	disabled?: boolean;
	icon?: ReactNode;
	children?: ReactNode;
};
