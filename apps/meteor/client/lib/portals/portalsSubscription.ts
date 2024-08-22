import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import type { ReactPortal } from 'react';

type SubscribedPortal = {
	portal: ReactPortal;
	key: string;
};

type PortalsSubscription = {
	subscribe: (callback: () => void) => () => void;
	getSnapshot: () => SubscribedPortal[];
	has: (key: unknown) => boolean;
	set: (key: unknown, portal: ReactPortal) => void;
	delete: (key: unknown) => void;
};

const createPortalsSubscription = (): PortalsSubscription => {
	const portalsMap = new Map<unknown, SubscribedPortal>();
	let portals = Array.from(portalsMap.values());
	const emitter = new Emitter<{ update: void }>();

	return {
		getSnapshot: (): SubscribedPortal[] => portals,
		subscribe: (callback): (() => void) => emitter.on('update', callback),
		delete: (key): void => {
			portalsMap.delete(key);
			portals = Array.from(portalsMap.values());
			emitter.emit('update');
		},
		set: (key, portal): void => {
			portalsMap.set(key, { portal, key: Random.id() });
			portals = Array.from(portalsMap.values());
			emitter.emit('update');
		},
		has: (key): boolean => portalsMap.has(key),
	};
};

export const portalsSubscription = createPortalsSubscription();

export const unregisterPortal = (key: unknown): void => {
	portalsSubscription.delete(key);
};

export const registerPortal = (key: unknown, portal: ReactPortal): (() => void) => {
	portalsSubscription.set(key, portal);
	return (): void => {
		unregisterPortal(key);
	};
};
