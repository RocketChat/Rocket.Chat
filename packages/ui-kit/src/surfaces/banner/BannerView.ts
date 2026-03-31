import type { Keys as IconName } from '@rocket.chat/icons';
import typia from 'typia';

import type { View } from '../View';
import type { BannerSurfaceLayout } from './UiKitParserBanner';

/**
 * A view that is displayed as a banner.
 */
// Omitting `blocks` from `View` because array intersections are weird
export type BannerView = Omit<View, 'blocks'> & {
	viewId: string;
	inline?: boolean;
	variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
	icon?: IconName;
	title?: string; // TODO: change to plain_text block in the future
	blocks: BannerSurfaceLayout;
};

export const isBannerView = typia.createIs<BannerView>();
