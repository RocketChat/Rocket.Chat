import type { AriaAttributes, AriaRole } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type ThrobberContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-hidden'> & {
		role?: AriaRole;
		/** The diameter of each circle. */
		size?: 'x4' | 'x8' | 'x12' | 'x16' | 'x20' | 'x24' | 'x32' | 'x40';
		circleCount?: number;
		disabled?: boolean;
		/** Paints the circles with the color of the surrounding text. */
		inheritColor?: boolean;
	};
