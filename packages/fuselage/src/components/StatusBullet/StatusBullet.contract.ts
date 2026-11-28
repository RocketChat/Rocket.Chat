import type { AriaAttributes } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type StatusBulletContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'> & {
		status?: 'loading' | 'online' | 'busy' | 'away' | 'offline' | 'disabled';
		/** `'large'` renders the same as the default size and is deprecated. */
		size?: 'small' | 'large';
	};
