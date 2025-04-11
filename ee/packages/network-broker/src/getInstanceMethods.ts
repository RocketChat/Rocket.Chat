import type { IServiceClass } from '@rocket.chat/core-services';

export function getInstanceMethods(instance: IServiceClass) {
	return (
		instance.constructor?.name === 'Object'
			? Object.getOwnPropertyNames(instance)
			: Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
	).filter((name) => name !== 'constructor');
}
