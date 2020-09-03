import { api } from '../api';

type FunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

type Prom<T> = {
	[K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any> ? T[K] : (...params: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
}

function handler<T extends object>(namespace: string): ProxyHandler<T> {
	return {
		get: (_target: T, prop: string): any => (...params: any): Promise<any> => api.call(`${ namespace }.${ prop }`, params),
	};
}

export function proxify<T>(namespace: string): Prom<T> {
	return new Proxy({}, handler(namespace)) as unknown as Prom<T>;
}
