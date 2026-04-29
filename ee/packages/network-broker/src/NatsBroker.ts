import type { IBroker, IBrokerNode, IServiceMetrics, IServiceClass, EventSignatures } from '@rocket.chat/core-services';
import EJSON from 'ejson';
import type { ConnectionOptions, NatsConnection } from 'nats';
import { connect } from 'nats';

import { getInstanceMethods } from './getInstanceMethods';

export { connect } from 'nats';

const TE = new TextEncoder();
const TD = new TextDecoder();

const lifecycleMethods = new Set(['created', 'started', 'stopped']);

const serviceEvents = new Set<{
	eventName: keyof EventSignatures;
	listeners: {
		(...args: any[]): void;
	}[];
}>();

export class NatsBroker implements IBroker {
	metrics?: IServiceMetrics | undefined;

	private nc?: NatsConnection;

	private started = false;

	private pendingServices: IServiceClass[] = [];

	constructor(private options: ConnectionOptions) {}

	async destroyService(service: IServiceClass): Promise<void> {
		await service.stopped();
	}

	async createService(instance: IServiceClass, _serviceDependencies?: string[]): Promise<void> {
		if (!this.started) {
			this.pendingServices.push(instance);
			return;
		}

		await this.registerService(instance);
		await instance.created();
		await instance.started();
	}

	private async registerService(instance: IServiceClass): Promise<void> {
		if (!this.nc) {
			throw new Error('NatsBroker not connected');
		}

		const name = instance.getName() ?? 'error';

		const serviceInstance = instance as any;

		const natsService = await this.nc.services.add({
			name,
			version: '0.1.0',
		});

		for (const event of instance.getEvents()) {
			// TODO need to add a routine to remove the events once the service is destroyed
			serviceEvents.add(event);

			for (const listener of event.listeners) {
				this.nc.subscribe(String(event.eventName), {
					callback: (_error, msg) => {
						const decoded = TD.decode(msg.data);
						const params = decoded ? EJSON.parse(decoded) : [];

						listener(...params);
					},
				});
			}
		}

		const group = natsService.addGroup(name);

		const methods = getInstanceMethods(instance);
		for (const method of methods) {
			if (method.match(/^on[A-Z]/) || lifecycleMethods.has(method)) {
				continue;
			}

			group.addEndpoint(method, async (_error, msg) => {
				try {
					const decoded = TD.decode(msg.data);
					const params = decoded ? EJSON.parse(decoded) : [];

					const res = await serviceInstance[method](...params);

					msg?.respond(TE.encode(EJSON.stringify(res)));
				} catch (e) {
					console.error('error', e);
				}
			});
		}
	}

	async call(method: string, data: any): Promise<any> {
		if (!this.started || !this.nc) {
			return;
		}

		try {
			const params = data ? TE.encode(EJSON.stringify(data)) : new Uint8Array(0);
			const res = await this.nc.request(method, params);

			const decoded = TD.decode(res.data);
			return decoded ? EJSON.parse(decoded) : undefined;
		} catch (e) {
			console.error(e);
			throw e;
		}
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		_services: string[],
		_event: T,
		..._args: Parameters<EventSignatures[T]>
	): Promise<void> {
		// TODO implement
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		if (!this.started || !this.nc) {
			return;
		}

		this.nc.publish(String(event), TE.encode(EJSON.stringify(args)));
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		for (const serviceEvent of serviceEvents) {
			if (serviceEvent.eventName === event) {
				serviceEvent.listeners.forEach((listener) => {
					listener(...args);
				});
			}
		}
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return [];
	}

	async start(): Promise<void> {
		this.nc = await connect(this.options);
		this.started = true;

		const pending = this.pendingServices;
		this.pendingServices = [];

		// Two-phase init: register all endpoints/events for every pending
		// service before invoking any lifecycle hooks, so that a service's
		// started() can call into another local service that was registered
		// later in the list.
		for (const instance of pending) {
			await this.registerService(instance);
		}

		for (const instance of pending) {
			await instance.created();
		}

		for (const instance of pending) {
			await instance.started();
		}

		console.log('NatsBroker started successfully.');
	}
}
