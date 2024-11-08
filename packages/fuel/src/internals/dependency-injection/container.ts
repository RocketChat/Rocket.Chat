import { InMemoryExternalModuleConsumer, RemoteExternalModuleConsumer } from '../communication';
import { Container, injectable, INJECTION_SCOPE } from './definition';
import type { interfaces } from './definition';

export const container = new Container({ skipBaseClassChecks: true });

export abstract class AbstractDependencyContainerManager {
	protected container = container;

	public resolveByToken<T>(token: interfaces.ServiceIdentifier<T>): T {
		return this.container.get<T>(token);
	}

	public resolveByInstance<T>(instance: interfaces.Newable<T>): T {
		return this.container.resolve<T>(instance);
	}
}

export class DependencyContainerManager extends AbstractDependencyContainerManager {
	public registerSingleton<T>(token: interfaces.ServiceIdentifier<T>, instance: interfaces.Newable<T>): void {
		if (this.isRegistered(token)) {
			console.log(`${token.toString()} was already registered and was overwritten`);
		}
		this.container.bind(token).to(instance).inSingletonScope();
	}

	public registerClass<T>(token: interfaces.ServiceIdentifier<T>, constructor: interfaces.Newable<T>): void {
		if (this.isRegistered(token)) {
			console.log(`${token.toString()} was already registered and was overwritten`);
		}
		this.container.bind(token).to(constructor);
	}

	public registerValue<T>(token: interfaces.ServiceIdentifier<T>, value: any): void {
		if (this.isRegistered(token)) {
			console.log(`${token.toString()} was already registered and was overwritten`);
		}
		this.container.bind(token).toConstantValue(value);
	}

	public registerValueAsFunction<T>(
		token: interfaces.ServiceIdentifier<T>,
		value: interfaces.DynamicValue<T>,
		scope: INJECTION_SCOPE = INJECTION_SCOPE.TRANSIENT,
	): void {
		if (this.isRegistered(token)) {
			console.log(`${token.toString()} was already registered and was overwritten`);
		}
		this.container.bind(token).toDynamicValue(value)[scope === INJECTION_SCOPE.TRANSIENT ? 'inTransientScope' : 'inSingletonScope']();
	}

	public unregister(token: interfaces.ServiceIdentifier): void {
		if (!this.isRegistered(token)) {
			return;
		}
		this.container.unbind(token);
	}

	public isRegistered(token: interfaces.ServiceIdentifier): boolean {
		return this.container.isBound(token);
	}
}

export interface IDependencyContainerReader {
	resolveByInstance<T>(token: interfaces.Newable<T>): T;
	resolveByToken<T>(token: interfaces.ServiceIdentifier<T>): T;
}

@injectable()
export class ReadOnlyDependencyContainerManager extends AbstractDependencyContainerManager implements IDependencyContainerReader { }

// TODO: This container should be removed as soon as we migrate everything to use DI
class MonolithIntegrationContainer extends AbstractDependencyContainerManager {

	public registerSingleton<T>(token: interfaces.ServiceIdentifier<T>, instance: interfaces.Newable<T>): void {
		if (!(instance.prototype instanceof RemoteExternalModuleConsumer) && !(instance.prototype instanceof InMemoryExternalModuleConsumer)) {
			throw new Error('Only "RemoteExternalModuleConsumer" or "InMemoryExternalModuleConsumer" are allowed to be registered inside the monolith');
		}
		this.container.bind(token).to(instance).inSingletonScope();
	}
}

export const monolithIntegrationContainer = new MonolithIntegrationContainer();
