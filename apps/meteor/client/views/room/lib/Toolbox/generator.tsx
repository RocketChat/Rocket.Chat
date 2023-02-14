import type { EventHandlerOf } from '@rocket.chat/emitter';
import { Emitter } from '@rocket.chat/emitter';

export type Store<T> = Map<string, T>;

export type Events<T> = {
	change: Store<T>;
};

export const generator = function generator<T>(name?: string): {
	store: Store<T>;
	add: (id: string, action: T) => Store<T>;
	remove: (id: string) => boolean;
	listen: (handler: EventHandlerOf<Events<T>, 'change'>) => () => void;
	name: string | undefined;
} {
	const store: Store<T> = new Map();
	const emitter = new Emitter<Events<T>>();

	const add = (id: string, action: T): Store<T> => {
		store.set(id, action);
		emitter.emit('change', store);
		return store;
	};

	const remove = (id: string): boolean => {
		const result = store.delete(id);
		emitter.emit('change', store);
		return result;
	};

	const listen = (handler: EventHandlerOf<Events<T>, 'change'>): (() => void) => emitter.on('change', handler);

	return Object.freeze({
		store,
		add,
		remove,
		listen,
		name,
	});
};
