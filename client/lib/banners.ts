import { IBlock } from '@rocket.chat/ui-kit';

import { mountRoot } from '../reactAdapters';
import { createValueSubscription } from './createValueSubscription';

export type LegacyBannerPayload = {
	closable?: boolean;
	title?: string;
	text?: string;
	html?: string;
	icon?: string;
	modifiers?: ('large' | 'danger')[];
	timer?: number;
	action?: () => void;
	onClose?: () => void;
};

export type UiKitBannerPayload = {
	inline?: boolean;
	variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
	icon?: string;
	title?: string;
	blocks: IBlock[];
};

type BannerPayload = LegacyBannerPayload | UiKitBannerPayload;

export const isLegacyPayload = (payload: BannerPayload): payload is LegacyBannerPayload =>
	!('blocks' in payload);

export const subscription = createValueSubscription<BannerPayload | null>(null);

export const open = (payload: BannerPayload): void => {
	mountRoot();
	subscription.setCurrentValue(payload);
};

export const close = (): void => {
	subscription.setCurrentValue(null);
};
