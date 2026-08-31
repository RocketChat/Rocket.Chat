import type { Keys as IconName } from '@rocket.chat/icons';
import typia from 'typia';

import type { TextObject } from '../../blocks/TextObject';
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
	/** Title as plain string (legacy) or UiKit text object (e.g. { type: 'mrkdwn', text: '...' }). */
	title?: string | TextObject;
	blocks: BannerSurfaceLayout;
};

export const isBannerView = typia.createIs<BannerView>();
