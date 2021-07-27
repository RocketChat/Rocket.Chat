import { ServiceBroker, Context, ServiceSchema, Serializers } from 'moleculer';
import EJSON from 'ejson';

import { asyncLocalStorage, License } from '../../server/sdk';
import { api } from '../../server/sdk/api';
import { IBroker, IBrokerNode, IServiceMetrics } from '../../server/sdk/types/IBroker';
import { ServiceClass } from '../../server/sdk/types/ServiceClass';
import { EventSignatures } from '../../server/sdk/lib/Events';
import { LocalBroker } from '../../server/sdk/lib/LocalBroker';

const events: {[k: string]: string} = {
	onNodeConnected: '$node.connected',
	onNodeUpdated: '$node.updated',
	onNodeDisconnected: '$node.disconnected',
};

const lifecycle: {[k: string]: string} = {
	created: 'created',
	started: 'started',
	stopped: 'stopped',
};

const {
	INTERNAL_SERVICES_ONLY = 'false',
	SERVICES_ALLOWED = '',
	WAIT_FOR_SERVICES_TIMEOUT = '10000', // 10 seconds
	WAIT_FOR_SERVICES_WHITELIST_TIMEOUT = '600000', // 10 minutes
} = process.env;

const waitForServicesTimeout = parseInt(WAIT_FOR_SERVICES_TIMEOUT, 10) || 10000;
const waitForServicesWhitelistTimeout = parseInt(WAIT_FOR_SERVICES_WHITELIST_TIMEOUT, 10) || 600000;

class NetworkBroker implements IBroker {
	private broker: ServiceBroker;

	private localBroker = new LocalBroker();

	private allowed: Promise<boolean>;

	private started: Promise<void>;

	private whitelist = {
		events: ['license.module', 'watch.settings'],
		actions: ['license.hasLicense'],
	}

	// whether only internal services are allowed to be registered
	private internalOnly = ['true', 'yes'].includes(INTERNAL_SERVICES_ONLY.toLowerCase());

	// list of allowed services to run - has precedence over `internalOnly`
	private allowedList = new Set<string>(SERVICES_ALLOWED?.split(',').map((i) => i.trim()).filter((i) => i));

	metrics: IServiceMetrics;

	constructor(broker: ServiceBroker) {
		this.broker = broker;

		api.setBroker(this);

		this.metrics = broker.metrics;

		this.started = this.broker.start();

		this.allowed = License.hasLicense('scalability');
	}

	isWhitelisted(list: string[], item: string): boolean {
		return list.includes(item);
	}

	isActionWhitelisted(method: string): boolean {
		return this.isWhitelisted(this.whitelist.actions, method);
	}

	isEventWhitelisted(event: string): boolean {
		return this.isWhitelisted(this.whitelist.events, event);
	}

	async call(method: string, data: any): Promise<any> {
		await this.started;

		if (!(this.isActionWhitelisted(method) || await this.allowed)) {
			return this.localBroker.call(method, data);
		}

		const context = asyncLocalStorage.getStore();
		if (context?.ctx?.call) {
			return context.ctx.call(method, data);
		}

		const services: {name: string}[] = await this.broker.call('$node.services', { onlyAvailable: true });
		if (!services.find((service) => service.name === method.split('.')[0])) {
			return new Error('method-not-available');
		}
		return this.broker.call(method, data);
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		await this.started;

		if (!(this.isActionWhitelisted(method) || await this.allowed)) {
			return this.localBroker.call(method, data);
		}

		try {
			await this.broker.waitForServices(method.split('.')[0], this.isActionWhitelisted(method) ? waitForServicesWhitelistTimeout : waitForServicesTimeout);
		} catch (err) {
			console.error(err);
		}

		const context = asyncLocalStorage.getStore();
		if (context?.ctx?.call) {
			return context.ctx.call(method, data);
		}

		return this.broker.call(method, data);
	}

	destroyService(instance: ServiceClass): void {
		this.localBroker.destroyService(instance);

		this.broker.destroyService(instance.getName());
	}

	createService(instance: ServiceClass): void {
		if (!this.isServiceAllowed(instance)) {
			return;
		}

		this.localBroker.createService(instance);

		const name = instance.getName();

		// Listen for module license
		instance.onEvent('license.module', async ({ module, valid }) => {
			if (module === 'scalability') {
				// Should we believe on the event only? Could it be a call from the CE version?
				this.allowed = valid ? License.hasLicense('scalability') : Promise.resolve(false);
				// console.log('on license.module', { allowed: this.allowed });
			}
		});

		const service: ServiceSchema = {
			name,
			actions: {},
			events: instance.getEvents().reduce<Record<string, Function>>((map, eventName) => {
				if (this.isEventWhitelisted(eventName)) {
					map[eventName] = (data: Parameters<EventSignatures[typeof eventName]>): void => instance.emit(eventName, ...data);
					return map;
				}

				map[eventName] = (data: Parameters<EventSignatures[typeof eventName]>): any => {
					this.allowed.then((allowed) => allowed && instance.emit(eventName, ...data));
				};

				return map;
			}, {}),
		};

		if (!service.events || !service.actions) {
			return;
		}

		const methods = instance.constructor?.name === 'Object' ? Object.getOwnPropertyNames(instance) : Object.getOwnPropertyNames(Object.getPrototypeOf(instance));
		for (const method of methods) {
			if (method === 'constructor') {
				continue;
			}

			const i = instance as any;

			if (method.match(/^on[A-Z]/)) {
				service.events[events[method]] = i[method].bind(i);
				continue;
			}

			if (lifecycle[method]) {
				service[method] = (): void => asyncLocalStorage.run({
					id: '',
					nodeID: this.broker.nodeID,
					requestID: null,
					broker: this,
				}, i[method].bind(i));
				continue;
			}

			service.actions[method] = async (ctx: Context<[]>): Promise<any> => asyncLocalStorage.run({
				id: ctx.id,
				nodeID: ctx.nodeID,
				requestID: ctx.requestID,
				broker: this,
				ctx,
			}, async (): Promise<any> => {
				if (this.isActionWhitelisted(`${ name }.${ method }`) || await this.allowed) {
					return i[method](...ctx.params);
				}
			});
		}

		this.broker.createService(service);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		if (!(this.isEventWhitelisted(event) || await this.allowed)) {
			return this.localBroker.broadcast(event, ...args);
		}
		return this.broker.broadcast(event, args);
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		this.broker.broadcastLocal(event, args);
	}

	async nodeList(): Promise<IBrokerNode[]> {
		return this.broker.call('$node.list');
	}

	private isServiceAllowed(instance: ServiceClass): boolean {
		// check if the service is in the list of allowed services if the list is not empty
		if (this.allowedList.size > 0 && !this.allowedList.has(instance.getName())) {
			return false;
		}

		// allow only internal services if internalOnly is true
		if (this.internalOnly && !instance.isInternal()) {
			return false;
		}

		return true;
	}
}

const Base = Serializers.Base as unknown as new () => {};

class EJSONSerializer extends Base {
	serialize(obj: {}): Buffer {
		return Buffer.from(EJSON.stringify(obj));
	}

	deserialize(buf: Buffer): any {
		return EJSON.parse(buf.toString());
	}
}

const {
	TRANSPORTER = '',
	CACHE = 'Memory',
	// SERIALIZER = 'MsgPack',
	SERIALIZER = 'EJSON',
	MOLECULER_LOG_LEVEL = 'error',
	BALANCE_STRATEGY = 'RoundRobin',
	BALANCE_PREFER_LOCAL = 'false',
	RETRY_FACTOR = '2',
	RETRY_MAX_DELAY = '1000',
	RETRY_DELAY = '100',
	RETRY_RETRIES = '5',
	RETRY_ENABLED = 'false',
	REQUEST_TIMEOUT = '10',
	HEARTBEAT_INTERVAL = '10',
	HEARTBEAT_TIMEOUT = '30',
	BULKHEAD_ENABLED = 'false',
	BULKHEAD_CONCURRENCY = '10',
	BULKHEAD_MAX_QUEUE_SIZE = '10000',
	MS_METRICS = 'false',
	MS_METRICS_PORT = '9458',
	TRACING_ENABLED = 'false',
	SKIP_PROCESS_EVENT_REGISTRATION = 'true',
} = process.env;

// only starts network broker if transporter properly configured
if (TRANSPORTER.match(/^(?:nats|TCP)/)) {
	const network = new ServiceBroker({
		// TODO: Reevaluate, without this setting it was preventing the process to stop
		skipProcessEventRegistration: SKIP_PROCESS_EVENT_REGISTRATION === 'true',
		transporter: TRANSPORTER,
		metrics: {
			enabled: MS_METRICS === 'true',
			reporter: [{
				type: 'Prometheus',
				options: {
					port: MS_METRICS_PORT,
				},
			}],
		},
		cacher: CACHE,
		serializer: SERIALIZER === 'EJSON' ? new EJSONSerializer() : SERIALIZER,
		logLevel: MOLECULER_LOG_LEVEL as any,
		// logLevel: {
		// 	// "TRACING": "trace",
		// 	// "TRANS*": "warn",
		// 	BROKER: 'debug',
		// 	TRANSIT: 'debug',
		// 	'**': 'info',
		// },
		logger: {
			type: 'Console',
			options: {
				formatter: 'short',
			},
		},
		registry: {
			strategy: BALANCE_STRATEGY,
			preferLocal: BALANCE_PREFER_LOCAL !== 'false',
		},

		requestTimeout: parseInt(REQUEST_TIMEOUT) * 1000,
		retryPolicy: {
			enabled: RETRY_ENABLED === 'true',
			retries: parseInt(RETRY_RETRIES),
			delay: parseInt(RETRY_DELAY),
			maxDelay: parseInt(RETRY_MAX_DELAY),
			factor: parseInt(RETRY_FACTOR),
			check: (err: any): boolean => err && !!err.retryable,
		},

		maxCallLevel: 100,
		heartbeatInterval: parseInt(HEARTBEAT_INTERVAL),
		heartbeatTimeout: parseInt(HEARTBEAT_TIMEOUT),

		// circuitBreaker: {
		// 	enabled: false,
		// 	threshold: 0.5,
		// 	windowTime: 60,
		// 	minRequestCount: 20,
		// 	halfOpenTime: 10 * 1000,
		// 	check: (err: any): boolean => err && err.code >= 500,
		// },

		bulkhead: {
			enabled: BULKHEAD_ENABLED === 'true',
			concurrency: parseInt(BULKHEAD_CONCURRENCY),
			maxQueueSize: parseInt(BULKHEAD_MAX_QUEUE_SIZE),
		},

		tracing: {
			enabled: TRACING_ENABLED === 'true',
			exporter: {
				type: 'Jaeger',
				options: {
					endpoint: null,
					host: 'jaeger',
					port: 6832,
					sampler: {
						// Sampler type. More info: https://www.jaegertracing.io/docs/1.14/sampling/#client-sampling-configuration
						type: 'Const',
						// Sampler specific options.
						options: {},
					},
					// Additional options for `Jaeger.Tracer`
					tracerOptions: {},
					// Default tags. They will be added into all span tags.
					defaultTags: null,
				},
			},
		},
	});

	new NetworkBroker(network);
}
