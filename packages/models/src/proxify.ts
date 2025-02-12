import type { IBaseModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

type ModelConfig = { trashCollection?: boolean };

const lazyModels = new Map<string, () => IBaseModel<any>>();
const models = new Map<string, IBaseModel<any>>();
const modelRegistry = new Map<Function, ModelConfig>();
const modelExports = new Map<string, unknown>();

function handler<T extends object>(namespace: string): ProxyHandler<T> {
	return {
		get: (_target: T, nameProp: keyof IBaseModel<any>): any => {
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
			const prop = model[nameProp];
			if (typeof prop === 'function') {
				return prop.bind(model);
			}
			return prop;
		},
		set() {
			if (process.env.NODE_ENV !== 'production') {
				throw new Error('Models accessed via proxify are read-only, use the model instance directly to modify it.');
			}
			/* istanbul ignore next */
			return true;
		},
	};
}

export function registerModel<TModel extends IBaseModel<any, any, any>>(
	name: string,
	instance: TModel | (() => TModel),
	overwriteExisting = true,
): void {
	if (!overwriteExisting && (lazyModels.has(name) || models.has(name))) {
		return;
	}

	if (typeof instance === 'function') {
		lazyModels.set(name, instance);
		modelExports.set(name, proxify<TModel>(name));
	} else {
		models.set(name, instance);
		modelExports.set(name, proxify<TModel>(name));
	}
}

export function model<IUsersModel>(config?: ModelConfig) {
	return <T extends { new (...args: any[]): IUsersModel }>(constructor: T) => {
		modelRegistry.set(constructor, config || {});
	};
}

export function registerModels(db: Db, trashCollection: any) {
	modelRegistry.forEach((config, constructor) => {
		const interfaceName = `I${constructor.name.replace(/(Raw)|Model|Dummy$/g, '')}Model`;

		const model = config.trashCollection ? () => new (constructor as any)(...[db, trashCollection]) : new (constructor as any)(...[db]);

		registerModel(interfaceName, model);
	});
}

export function proxify<T>(namespace: string): T {
	return new Proxy({}, handler(namespace)) as unknown as T;
}

export function getModelExports() {
	return Object.fromEntries(modelExports);
}
