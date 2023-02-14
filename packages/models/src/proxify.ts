import type { IBaseModel } from '@rocket.chat/model-typings';

const lazyModels = new Map<string, () => IBaseModel<any>>();
const models = new Map<string, IBaseModel<any>>();

function handler<T extends object>(namespace: string): ProxyHandler<T> {
	return {
		get: (_target: T, prop: keyof IBaseModel<any>): any => {
			if (!models.has(namespace) && lazyModels.has(namespace)) {
				const getModel = lazyModels.get(namespace);
				if (getModel) {
					models.set(namespace, getModel());
				}
			}

			const model = models.get(namespace);

			if (!model) {
				throw new Error(`Model ${namespace} not found`);
			}

			return model[prop];
		},
	};
}

export function registerModel<TModel extends IBaseModel<any, any, any>>(name: string, instance: TModel | (() => TModel)): void {
	if (typeof instance === 'function') {
		lazyModels.set(name, instance);
	} else {
		models.set(name, instance);
	}
}

export function proxify<T>(namespace: string): T {
	return new Proxy({}, handler(namespace)) as unknown as T;
}
