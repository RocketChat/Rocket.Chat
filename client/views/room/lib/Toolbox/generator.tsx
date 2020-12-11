import { Emitter, Handler } from '@rocket.chat/emitter';


export type Store<T> = Map<string, T>;

export const generator = function generator<T>(name?: string):
{
	store: Store<T>;
	add: (id: string, action: T) => Store<T>;
	remove: (id: string) => boolean;
	listen: (handler: Handler) => Function;
	name: string | undefined;
} {
	const store: Store<T> = new Map();
	const emitter = new Emitter();

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

	const listen = (handler: Handler): Function => emitter.on('change', handler);

	return Object.freeze({
		store,
		add,
		remove,
		listen,
		name,
	});
};
