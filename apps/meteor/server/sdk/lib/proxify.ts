import type { FunctionPropertyNames, PromOrError } from '@rocket.chat/core-typings';

import { api } from '../api';

type Prom<T> = {
	[K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any>
		? T[K]
		: (...params: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
};

function handler<T extends object>(namespace: string, waitService: boolean): ProxyHandler<T> {
	return {
		get:
			(_target: T, prop: string): any =>
			(...params: any): Promise<any> =>
				api[waitService ? 'waitAndCall' : 'call'](`${namespace}.${prop}`, params),
	};
}

// TODO remove the need to wait for a service, if that is really needed it should have a dependency on startup
export function proxifyWithWait<T>(namespace: string): Prom<T> {
	return new Proxy({}, handler(namespace, true)) as unknown as Prom<T>;
}

export function proxify<T>(namespace: string): PromOrError<T> {
	return new Proxy({}, handler(namespace, false)) as unknown as Prom<T>;
}
