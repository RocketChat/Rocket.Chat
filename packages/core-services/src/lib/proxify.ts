import { api } from '../api';

type Promisify<T> = {
	[K in keyof T as T[K] extends (...params: any[]) => unknown ? K : never]: T[K] extends (...params: any[]) => Promise<any>
		? T[K]
		: T[K] extends (...params: infer P) => infer R
			? (...params: P) => Promise<R>
			: never;
};

function handler<T extends object>(namespace: string): ProxyHandler<T> {
	return {
		get:
			(_target: T, prop: string): any =>
			(...params: any): Promise<any> =>
				api.call(`${namespace}.${prop}`, params),
	};
}

export function proxify<T>(namespace: string): Promisify<T> {
	return new Proxy({}, handler(namespace)) as unknown as Promisify<T>;
}
