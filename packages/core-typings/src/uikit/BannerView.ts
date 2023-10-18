import type { Keys as IconName } from '@rocket.chat/icons';
import type { BannerSurfaceLayout } from '@rocket.chat/ui-kit';

import type { View } from './View';

/**
 * A view that is displayed as a banner.
 */
export type BannerView = View & {
	viewId: string;
	inline?: boolean;
	variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
	icon?: IconName;
	title?: string; // TODO: change to plain_text block in the future
	blocks: BannerSurfaceLayout;
};
