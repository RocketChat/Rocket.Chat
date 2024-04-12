import type { IBaseModel } from '@rocket.chat/model-typings';

type LazyModel<T> = () => T;

type NormalOrLazyModel<T> = T | LazyModel<T>;

type Store<T> = Map<string, NormalOrLazyModel<T>>;

const models = new Map<string, NormalOrLazyModel<Record<string, any>>>();
function handler<T extends Record<string | symbol, any>>(namespace: string, models: Store<T>): ProxyHandler<T> {
	return {
		get: (_target: T, nameProp: keyof T): any => {
			let model = models.get(namespace);

			if (!model) {
				throw new Error(`Model ${namespace} not found`);
			}

			if (typeof model === 'function') {
				const modelInstance = model();
				models.set(namespace, modelInstance);
				model = modelInstance;
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
	return register(name, instance, overwriteExisting);
}

function register<T extends Record<string, any>>(name: string, instance: NormalOrLazyModel<T>, overwriteExisting = true): void {
	if (!overwriteExisting && models.has(name)) {
		throw new Error(`Model ${name} already exists`);
	}

	models.set(name, instance);
}

export function proxify<T extends Record<string, any>>(
	namespace: string,
): T & {
	register: (instance: T, overwriteExisting?: boolean) => void;
} {
	return new Proxy(
		{
			register: (instance: T, overwriteExisting = true) => register(namespace, instance, overwriteExisting),
		},
		handler(namespace, models),
	) as unknown as T & {
		register: (instance: T, overwriteExisting?: boolean) => void;
	};
}
