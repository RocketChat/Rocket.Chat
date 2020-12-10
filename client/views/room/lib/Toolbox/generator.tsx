import { Emitter, Handler } from '@rocket.chat/emitter';

export const generator = function generator<T>(name?: string):
{
	store: Map<string, T>;
	add: (id: string, action: T) => Map<string, T>;
	remove: (id: string) => boolean;
	listen: (handler: Handler) => Function;
	name: string | undefined;
} {
	const store: Map<string, T> = new Map();
	const emitter = new Emitter();

	const add = (id: string, action: T): Map<string, T> => {
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
