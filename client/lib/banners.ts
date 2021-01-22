import { Emitter } from '@rocket.chat/emitter';
import { Subscription } from 'use-subscription';

import { mountRoot } from '../reactAdapters';
import { IBanner } from '../../definition/IBanner';

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

type BannerPayload = LegacyBannerPayload | IBanner['view'];

export const isLegacyPayload = (payload: BannerPayload): payload is LegacyBannerPayload =>
	!('blocks' in payload);

const queue: BannerPayload[] = [];
const emitter = new Emitter();

export const firstSubscription: Subscription<BannerPayload | null> = {
	getCurrentValue: () => queue[0] ?? null,
	subscribe: (callback) => emitter.on('update-first', callback),
};

export const open = (payload: BannerPayload): void => {
	mountRoot();

	queue.push(payload);
	emitter.emit('update');
	emitter.emit('update-last');

	if (queue.length === 1) {
		emitter.emit('update-first');
	}
};

export const close = (): void => {
	queue.shift();
	emitter.emit('update');
	emitter.emit('update-first');

	if (queue.length === 0) {
		emitter.emit('update-last');
	}
};

export const clear = (): void => {
	queue.splice(0, queue.length);
	emitter.emit('update');
	emitter.emit('update-first');
	emitter.emit('update-last');
};
