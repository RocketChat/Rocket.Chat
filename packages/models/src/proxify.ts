import type { IBaseModel } from '@rocket.chat/model-typings';

const lazyModels = new Map<string, () => IBaseModel<any>>();
const models = new Map<string, IBaseModel<any>>();

function handler<T extends object>(namespace: string): ProxyHandler<T> {
	return {
		get: (_target: T, prop: string): any => {
			if (!models.has(namespace) && lazyModels.has(namespace)) {
				const getModel = lazyModels.get(namespace);
				if (getModel) {
					models.set(namespace, getModel());
				}
			}

			// @ts-ignore
			return models.get(namespace)[prop];
		},
	};
}

export function registerModel(name: string, instance: IBaseModel<any> | (() => IBaseModel<any>)): void {
	if (typeof instance === 'function') {
		lazyModels.set(name, instance);
	} else {
		models.set(name, instance);
	}
}

export function proxify<T>(namespace: string): T {
	return new Proxy({}, handler(namespace)) as unknown as T;
}
