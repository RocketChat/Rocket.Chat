import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement, ReactNode } from 'react';

import type { ActionContract } from '../../types/Attributes.contract';

export type IconButtonContract = ActionContract & {
	icon: IconName | ReactElement<any>;
	/**
	 * What to pin to the button's corner, if anything — a `Badge`, as a rule.
	 *
	 * It is hidden from assistive technology, always: `aria-label` replaces a button's contents rather than adding
	 * to them, so a badge inside a labelled button is never read out. What it says has to reach `aria-label`
	 * instead, which is the caller's to write.
	 */
	badge?: ReactNode;
	/** The corner the badge is pinned to. */
	badgePosition?: 'top-end' | 'bottom-end';
	variant?:
		'primary' | 'secondary' | 'info' | 'danger' | 'warning' | 'success' | 'secondary-danger' | 'secondary-warning' | 'secondary-success';
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large';
	pressed?: boolean;
	disabled?: boolean;
	/** Paints the glyph with a font token, for icon-only actions on light surfaces. */
	color?: 'default' | 'danger';
	children?: ReactNode;
};
