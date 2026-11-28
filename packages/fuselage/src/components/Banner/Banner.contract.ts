import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes } from '../../types/Attributes.contract';

export type BannerVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type BannerContract = CommonAttributes &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-live'> & {
		role?: AriaRole;
		variant?: BannerVariant;
		title?: string;
		children?: ReactNode;
		icon?: ReactNode;
		inline?: boolean;
		/** Only the cursor: the press of the banner is `onAction`. */
		actionable?: boolean;
		closeable?: boolean;
		link?: string;
		linkText?: string;
		linkTarget?: '_self' | '_blank' | '_parent' | '_top';
		/** The press of the banner itself, which makes it a button. */
		onAction?: () => void;
		onClose?: () => void;
	};
