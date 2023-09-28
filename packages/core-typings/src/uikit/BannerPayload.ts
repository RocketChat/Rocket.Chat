import type { Keys as IconName } from '@rocket.chat/icons';
import type { BannerSurfaceLayout } from '@rocket.chat/ui-kit';

import type { Payload } from './Payload';

export type BannerPayload = {
	inline?: boolean;
	variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
	icon?: IconName;
	title?: string; // TODO: change to plain_text block in the future
	blocks: BannerSurfaceLayout;
} & Payload;
