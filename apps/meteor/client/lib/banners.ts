import type { UiKit } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { Keys as IconName } from '@rocket.chat/icons';

export type LegacyBannerPayload = {
	id: string;
	closable?: boolean;
	title?: string | (() => string);
	text?: string | (() => string);
	html?: string | (() => string);
	icon?: IconName;
	modifiers?: ('large' | 'danger')[];
	timer?: number;
	action?: () => Promise<void> | void;
	onClose?: () => Promise<void> | void;
};

type BannerPayload = LegacyBannerPayload | UiKit.BannerView;

export const isLegacyPayload = (payload: BannerPayload): payload is LegacyBannerPayload => !('blocks' in payload);

const queue: BannerPayload[] = [];
const emitter = new Emitter<{
	'update': undefined;
	'update-first': undefined;
}>();

export const firstSubscription = [
	(callback: () => void): (() => void) => emitter.on('update-first', callback),
	(): BannerPayload | null => queue[0] ?? null,
] as const;

export const open = (payload: BannerPayload): void => {
	let index = queue.findIndex((_payload) => {
		if (isLegacyPayload(_payload) && isLegacyPayload(payload)) {
			return _payload.id === payload.id;
		}

		if (!isLegacyPayload(_payload) && !isLegacyPayload(payload)) {
			return _payload.viewId === payload.viewId;
		}

		return false;
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
