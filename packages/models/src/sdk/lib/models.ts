import type { IBaseModel } from '@rocket.chat/model-typings';

const models = new Map<string, IBaseModel<any>>();

function handler<T extends object>(namespace: string): ProxyHandler<T> {
	return {
		// @ts-expect-error
		get: (_target: T, prop: string): any => models.get(namespace)[prop],
	};
}

export function registerModel(name: string, instance: IBaseModel<any>): void {
	models.set(name, instance);
}

export function proxify<T>(namespace: string): T {
	return new Proxy({}, handler(namespace)) as unknown as T;
}
