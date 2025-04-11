import type { IBroker, IBrokerNode, IServiceMetrics, IServiceClass, EventSignatures } from '@rocket.chat/core-services';
import EJSON from 'ejson';
import type { NatsConnection } from 'nats';

import { getInstanceMethods } from './getInstanceMethods';

export { connect } from 'nats';

const TE = new TextEncoder();
const TD = new TextDecoder();

const serviceEvents = new Set<{
	eventName: keyof EventSignatures;
	listeners: {
		(...args: any[]): void;
	}[];
}>();

export class NatsBroker implements IBroker {
	metrics?: IServiceMetrics | undefined;

	constructor(private nc: NatsConnection) {}

	async destroyService(_service: IServiceClass): Promise<void> {
		console.log('Method not implemented. destroyService');
	}

	async createService(instance: IServiceClass, _serviceDependencies?: string[]): Promise<void> {
		// TODO remove
		const name = instance.getName() ?? 'error';

		const serviceInstance = instance as any;

		const natsService = await this.nc.services.add({
			name,
			version: '0.1.0',
		});

		instance.getEvents().forEach((event) => {
			// TODO need to add a routine to remove the events once the service is destroyed
			serviceEvents.add(event);

			event.listeners.forEach((listener) => {
				this.nc.subscribe(event.eventName, {
					callback: (_error, msg) => {
						const decoded = TD.decode(msg.data);
						const params = decoded ? EJSON.parse(decoded) : [];

						listener(...params);
					},
				});
			});
		});

		const group = natsService.addGroup(name);

		const methods = getInstanceMethods(instance);
		for (const method of methods) {
			if (method.match(/^on[A-Z]/)) {
				// service.events[events[method]] = serviceInstance[method].bind(serviceInstance);
				continue;
			}

			// if (lifecycle[method]) {
			// 	service[method] = (): void => {
			// 		asyncLocalStorage.run(
			// 			{
			// 				id: '',
			// 				nodeID: this.broker.nodeID,
			// 				requestID: null,
			// 				broker: this,
			// 			},
			// 			serviceInstance[method].bind(serviceInstance),
			// 		);
			// 	};
			// 	continue;
			// }

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

			// service.actions[method] = async (ctx: Context<[], { optl?: unknown }>): Promise<any> => {
			// 	return tracerSpan(
			// 		`action ${name}:${method}`,
			// 		{},
			// 		() => {
			// 			return asyncLocalStorage.run(
			// 				{
			// 					id: ctx.id,
			// 					nodeID: ctx.nodeID,
			// 					requestID: ctx.requestID,
			// 					broker: this,
			// 					ctx,
			// 				},
			// 				() => serviceInstance[method](...ctx.params),
			// 			);
			// 		},
			// 		ctx.meta?.optl,
			// 	);
			// };
		}
	}

	async call(method: string, data: any): Promise<any> {
		try {
			console.log('Calling', method, data);
			const params = data ? TE.encode(EJSON.stringify(data)) : new Uint8Array(0);
			const res = await this.nc.request(method, params);

			return EJSON.parse(TD.decode(res.data));
		} catch (e) {
			console.error('deu ruim', e);
		}
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		_services: string[],
		_event: T,
		..._args: Parameters<EventSignatures[T]>
	): Promise<void> {
		console.log('Method not implemented. broadcastToServices');
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		this.nc.publish(event, TE.encode(EJSON.stringify(args)));
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		// loop through service events and call the listener
		console.log('broadcastLocal', event, args);
		for (const serviceEvent of serviceEvents) {
			if (serviceEvent.eventName === event) {
				serviceEvent.listeners.forEach((listener) => {
					listener(...args);
				});
			}
		}
	}

	async nodeList(): Promise<IBrokerNode[]> {
		console.log('Method not implemented. nodeList');
		return [];
	}

	async start(): Promise<void> {
		console.log('Method not implemented. start');
	}
}
