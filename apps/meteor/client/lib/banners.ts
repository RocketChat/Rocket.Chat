import { UiKitBannerPayload } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Icon } from '@rocket.chat/fuselage';
import { ComponentProps } from 'react';
import { Subscription } from 'use-subscription';

export type LegacyBannerPayload = {
	id: string;
	closable?: boolean;
	title?: string;
	text?: string;
	html?: string;
	icon?: ComponentProps<typeof Icon>['name'];
	modifiers?: ('large' | 'danger')[];
	timer?: number;
	action?: () => void;
	onClose?: () => void;
};

type BannerPayload = LegacyBannerPayload | UiKitBannerPayload;

export const isLegacyPayload = (payload: BannerPayload): payload is LegacyBannerPayload => !('blocks' in payload);

const queue: BannerPayload[] = [];
const emitter = new Emitter<{
	'update': undefined;
	'update-first': undefined;
}>();

export const firstSubscription: Subscription<BannerPayload | null> = {
	getCurrentValue: () => queue[0] ?? null,
	subscribe: (callback) => emitter.on('update-first', callback),
};

export const open = (payload: BannerPayload): void => {
	let index = queue.findIndex((_payload) => {
		if (isLegacyPayload(_payload)) {
			return _payload.id === (payload as LegacyBannerPayload).id;
		}
		return (_payload as UiKitBannerPayload).viewId === (payload as UiKitBannerPayload).viewId;
	});

	if (index === -1) {
		index = queue.length;
	}

	queue[index] = payload;

	emitter.emit('update');

	if (index === 0) {
		emitter.emit('update-first');
	}
};

export const closeById = (id: string): void => {
	const index = queue.findIndex((banner) => {
		if (!isLegacyPayload(banner)) {
			return banner.viewId === id;
		}
		return banner.id === id;
	});

	if (index < 0) {
		return;
	}

	queue.splice(index, 1);
	emitter.emit('update');
	index === 0 && emitter.emit('update-first');
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
