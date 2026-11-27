import type { AriaAttributes, AriaRole } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type SkeletonContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-busy' | 'aria-hidden'> & {
		role?: AriaRole;
		variant?: 'text' | 'rect' | 'circle';
		/** Whether the placeholder sits on a dark surface, such as a tooltip */
		inverted?: boolean;
		/** The size of the content the placeholder stands in for: a number of pixels, a size token such as `x200` or `full`, or a length. */
		width?: number | string;
		height?: number | string;
		/** The shape of the content the placeholder stands in for when its height follows its width, such as `21 / 9`. */
		aspectRatio?: string;
	};
