import { getInstanceMethods } from './getInstanceMethods';
import type { IServiceClass } from '../types/ServiceClass';

const lifecycleMethods = new Set(['created', 'started', 'stopped']);

export type LocalHandler = (args: unknown[]) => Promise<unknown>;

/**
 * The methods a service answers calls on. Event handlers (`onSomething`) are
 * reached through the event bus and the lifecycle hooks belong to the broker,
 * so neither is callable.
 */
export function getCallableMethods(instance: IServiceClass): string[] {
	return getInstanceMethods(instance).filter((method) => !method.match(/^on[A-Z]/) && !lifecycleMethods.has(method));
}

/**
 * Indexes the services running in this process by `<service>.<method>`, so a
 * broker can dispatch to the instance rather than go over its transport.
 *
 * Call sites depend on that dispatch staying direct: arguments arrive by
 * reference, which is the only reason handing a mongo cursor or a stream to
 * `api.call` ever worked - see `ee/server/configuration/abac.ts`, which passes
 * a cursor. Serialising those throws.
 */
export class LocalServiceRegistry {
	private services = new Map<string, { instance: IServiceClass; methods: Set<string> }>();

	add(instance: IServiceClass): void {
		const name = instance.getName();
		if (!name) {
			return;
		}

		this.services.set(name, { instance, methods: new Set(getCallableMethods(instance)) });
	}

	remove(instance: IServiceClass): void {
		const name = instance.getName();

		// the name may have been claimed by a newer instance already
		if (name && this.services.get(name)?.instance === instance) {
			this.services.delete(name);
		}
	}

	/** Undefined when this process does not serve `method`, so the caller falls back to the transport. */
	resolve(method: string): LocalHandler | undefined {
		const separator = method.indexOf('.');
		if (separator === -1) {
			return undefined;
		}

		const service = this.services.get(method.slice(0, separator));
		const name = method.slice(separator + 1);

		if (!service?.methods.has(name)) {
			return undefined;
		}

		return async (args: unknown[]): Promise<unknown> => (service.instance as any)[name](...args);
	}
}
