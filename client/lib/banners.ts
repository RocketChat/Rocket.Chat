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

type BannerPayload = LegacyBannerPayload;

export const subscription = createValueSubscription<BannerPayload | null>(null);

export const open = (payload: LegacyBannerPayload): void => {
	mountRoot(); // ensure <BannerRegion /> is mounted
	subscription.setCurrentValue(payload);
};

export const close = (): void => {
	subscription.setCurrentValue(null);
};
