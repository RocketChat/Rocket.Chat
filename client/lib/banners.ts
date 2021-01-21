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

const push = (payload: BannerPayload): void => {
	queue.push(payload);
	emitter.emit('update');
	emitter.emit('update-last');

	if (queue.length === 1) {
		emitter.emit('update-first');
	}
};

const shift = (): void => {
	queue.shift();
	emitter.emit('update');
	emitter.emit('update-first');

	if (queue.length === 0) {
		emitter.emit('update-last');
	}
};

export const firstSubscription: Subscription<BannerPayload | null> = {
	getCurrentValue: () => queue[0] ?? null,
	subscribe: (callback) => emitter.on('update-first', callback),
};

export const open = (payload: BannerPayload): void => {
	mountRoot();
	push(payload);
};

export const close = (): void => {
	shift();
};
