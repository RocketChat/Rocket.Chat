import cloneDeep from 'lodash.clonedeep';

export class Utilities {
	public static deepClone<T>(item: T): T {
		return cloneDeep(item);
	}

	public static deepFreeze<T extends object>(item: T): T {
		Object.freeze(item);

		Object.getOwnPropertyNames(item).forEach((prop: string) => {
			if (
				Object.hasOwn(item, prop) &&
				item[prop] !== null &&
				(typeof item[prop] === 'object' || typeof item[prop] === 'function') &&
				!Object.isFrozen(item[prop])
			) {
				Utilities.deepFreeze(item[prop]);
			}
		});

		return item;
	}

	public static deepCloneAndFreeze<T extends object>(item: T): T {
		return Utilities.deepFreeze(Utilities.deepClone(item));
	}

	public static omit(object: { [key: string]: any }, keys: Array<string>) {
		const cloned = this.deepClone(object);
		for (const key of keys) {
			delete cloned[key];
		}
		return cloned;
	}
}
