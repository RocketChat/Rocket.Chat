import type { IServiceClass } from '@rocket.chat/core-services';

import { getInstanceMethods } from './getInstanceMethods';

const lifecycleMethods = new Set(['created', 'started', 'stopped']);

export type LocalHandler = (args: unknown[]) => Promise<unknown>;

/**
 * The methods a service answers calls on. Event handlers (`onSomething`) are
 * reached through the event subjects and the lifecycle hooks belong to the
 * broker, so neither is callable.
 */
export function getCallableMethods(instance: IServiceClass): string[] {
	return getInstanceMethods(instance).filter((method) => !method.match(/^on[A-Z]/) && !lifecycleMethods.has(method));
}

/**
 * Tracks the services running in this process so a call to one of them can skip
 * the transport entirely.
 *
 * Moleculer dispatches a call to a locally registered service straight to the
 * instance, and call sites rely on it: arguments arrive by reference, which is
 * the only reason handing a mongo cursor or a stream to `api.call` ever worked.
 * Serialising those throws, so a broker that always goes over the wire breaks
 * them - see `ee/server/configuration/abac.ts`, which passes a cursor.
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
