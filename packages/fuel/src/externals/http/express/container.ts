import type { IocAdapter } from 'routing-controllers';

import type { IDependencyContainerReader, interfaces } from '../../../internals';

export class InversifyAdapter implements IocAdapter {
	constructor(private readonly container: IDependencyContainerReader) {}

	public get<T>(someClass: interfaces.Newable<T>): T {
		return this.container.resolveByInstance(someClass);
	}
}
