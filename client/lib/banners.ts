import { Emitter } from '@rocket.chat/emitter';
import { Subscription } from 'use-subscription';

import { mountRoot } from '../reactAdapters';
import { UiKitBannerPayload } from '../../definition/UIKit';

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

type BannerPayload = LegacyBannerPayload | UiKitBannerPayload;

export const isLegacyPayload = (payload: BannerPayload): payload is LegacyBannerPayload => !('blocks' in payload);

const queue: BannerPayload[] = [];
const emitter = new Emitter();

export const firstSubscription: Subscription<BannerPayload | null> = {
	getCurrentValue: () => queue[0] ?? null,
	subscribe: (callback) => emitter.on('update-first', callback),
};

export const open = (payload: BannerPayload): void => {
	mountRoot();

	let index = -1;

	if (!isLegacyPayload(payload)) {
		index = queue.findIndex((_payload) => !isLegacyPayload(_payload) && _payload.viewId === payload.viewId);
	}

	if (index < 0) {
		index = queue.length;
	}

	queue[index] = payload;

	emitter.emit('update');

	if (index === 0) {
		emitter.emit('update-first');
	}
};


export const closeById = (viewId: string): void => {
	const index = queue.findIndex((banner) => !isLegacyPayload(banner) && banner.viewId === viewId);
	if (index < 0) {
		return;
	}

	queue.splice(index, 1);
	emitter.emit('update');
	emitter.emit('update-first');
};

export const close = (): void => {
	queue.shift();
	emitter.emit('update');
	emitter.emit('update-first');
};

export const clear = (): void => {
	queue.splice(0, queue.length);
	emitter.emit('update');
	emitter.emit('update-first');
};
