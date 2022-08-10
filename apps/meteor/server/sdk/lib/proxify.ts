import { api } from '../api';

type Prom<T> = {
	[K in keyof T as T[K] extends (...params: any) => any ? K : never]: T[K] extends (...params: any) => Promise<any>
		? T[K]
		: T[K] extends (...params: infer P) => infer R
		? (...params: P) => Promise<R>
		: never;
};

type PromOrError<T> = {
	[K in keyof T as T[K] extends (...params: any) => any ? K : never]: T[K] extends (...params: any) => Promise<any>
		? T[K]
		: T[K] extends (...params: infer P) => infer R
		? (...params: P) => Promise<R | Error>
		: never;
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
	return new Proxy({}, handler(namespace, false)) as unknown as PromOrError<T>;
}
