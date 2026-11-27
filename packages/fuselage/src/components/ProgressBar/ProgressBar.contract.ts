import type { AriaAttributes, AriaRole } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type ProgressBarContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-valuenow' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuetext'> & {
		role?: AriaRole;
		/** How much of the bar is filled, from 0 to 100. */
		percentage: number;
		variant?: 'info' | 'success' | 'warning' | 'danger';
		/** Paints the bar as `danger` and describes what failed. */
		error?: string;
		animated?: boolean;
		light?: boolean;
	};
