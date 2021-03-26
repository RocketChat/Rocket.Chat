import { Emitter } from '@rocket.chat/emitter';
import { Random } from 'meteor/random';
import type { ReactElement } from 'react';
import type { Subscription, Unsubscribe } from 'use-subscription';

type SubscribedPortal = {
	portal: ReactElement;
	key: string;
};

type PortalsSubscription = Subscription<SubscribedPortal[]> & {
	has: (key: unknown) => boolean;
	set: (key: unknown, portal: ReactElement) => void;
	delete: (key: unknown) => void;
};

const createPortalsSubscription = (): PortalsSubscription => {
	const portalsMap = new Map<unknown, SubscribedPortal>();
	const emitter = new Emitter<{ update: void }>();

	return {
		getCurrentValue: (): SubscribedPortal[] => Array.from(portalsMap.values()),
		subscribe: (callback): Unsubscribe => emitter.on('update', callback),
		delete: (key): void => {
			portalsMap.delete(key);
			emitter.emit('update');
		},
		set: (key, portal): void => {
			portalsMap.set(key, { portal, key: Random.id() });
			emitter.emit('update');
		},
		has: (key): boolean => portalsMap.has(key),
	};
};

export const portalsSubscription = createPortalsSubscription();

export const unregisterPortal = (key: unknown): void => {
	portalsSubscription.delete(key);
};

export const registerPortal = (key: unknown, portal: ReactElement): (() => void) => {
	portalsSubscription.set(key, portal);
	return (): void => {
		unregisterPortal(key);
	};
};
