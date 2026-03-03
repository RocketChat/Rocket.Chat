import type { IBaseModel } from '@rocket.chat/model-typings';

const lazyModels = new Map<string, () => IBaseModel<any>>();
const models = new Map<string, IBaseModel<any>>();

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
	} else {
		models.set(name, instance);
	}
}

export function proxify<T>(namespace: string): T {
	return new Proxy({}, handler(namespace)) as unknown as T;
}

/**
 * Runs createIndexes() on all registered models. Intended to be called from
 * onServerVersionChange so index creation happens once per version change
 * instead of on every model instantiation.
 */
export async function ensureAllIndexes(): Promise<void> {
	const names = new Set([...lazyModels.keys(), ...models.keys()]);

	// Ensure trash collection indexes are created first since many models depend on it
	if (names.has('ITrashModel')) {
		try {
			const trashModel = proxify('ITrashModel') as IBaseModel<any, any, any> & { createIndexes?: () => Promise<void> };
			if (typeof trashModel.createIndexes === 'function') {
				await trashModel.createIndexes();
			}
		} catch (err) {
			console.warn('ensureAllIndexes: failed to create trash collection indexes', err);
		}
		names.delete('ITrashModel');
	}

	for await (const name of names) {
		try {
			const model = proxify(name) as IBaseModel<any, any, any> & { createIndexes?: () => Promise<void> };
			if (typeof model.createIndexes === 'function') {
				await model.createIndexes();
			}
		} catch (err) {
			console.warn(`ensureAllIndexes: failed for model ${name}`, err);
		}
	}
}
