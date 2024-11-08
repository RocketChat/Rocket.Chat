import { ServiceBroker } from 'moleculer';
import type { Service, ServiceSchema, BrokerOptions } from 'moleculer';

import type { IInterProcessCommunicationDriver, InterProcessCommunicationStartParams } from '../definition';
import { ILogger } from '../../observability';

export abstract class AbstractMoleculerBroker {
	constructor(protected broker: ServiceBroker) {}

	protected async destroyServiceIfExists(serviceName: string): Promise<void> {
		if (!this.broker.started) {
			throw new Error('Cannot destroy services with the moleculer broker in a stopped status');
		}
		if (!this.broker.getLocalService(serviceName)) {
			return;
		}
		await this.broker.destroyService(serviceName);
	}

	protected async getLocalService(serviceName: string): Promise<Service | undefined> {
		if (!this.broker.started) {
			throw new Error('Cannot get services with the moleculer broker in a stopped status');
		}
		return this.broker.getLocalService(serviceName);
	}

	protected async createService(service: ServiceSchema): Promise<void> {
		if (!this.broker.started) {
			throw new Error('Cannot create services with the moleculer broker in a stopped status');
		}
		this.broker.createService(service);
	}

	protected async call<TIn, TOut>(serviceName: string, action: string, params: TIn): Promise<TOut> {
		if (!this.broker.started) {
			throw new Error('Cannot call service actions with the moleculer broker in a stopped status');
		}

		return this.broker.call<TOut, TIn>(`${serviceName}.${action}`, params);
	}

	protected async broadcast<TIn>(eventName: string, params: TIn): Promise<void> {
		if (!this.broker.started) {
			throw new Error('Cannot broadcast events with the moleculer broker in a stopped status');
		}

		return this.broker.broadcast<TIn>(eventName, params);
	}
}

// TODO: Receive this from parameters
const {
	MS_NAMESPACE = '',
	TRANSPORTER = 'TCP',
	CACHE = 'Memory',
	// SERIALIZER = 'MsgPack',
	BALANCE_STRATEGY = 'RoundRobin',
	BALANCE_PREFER_LOCAL = 'true',
	RETRY_FACTOR = '2',
	RETRY_MAX_DELAY = '1000',
	RETRY_DELAY = '100',
	RETRY_RETRIES = '5',
	RETRY_ENABLED = 'false',
	REQUEST_TIMEOUT = '60',
	HEARTBEAT_INTERVAL = '10',
	HEARTBEAT_TIMEOUT = '30',
	BULKHEAD_ENABLED = 'false',
	BULKHEAD_CONCURRENCY = '10',
	BULKHEAD_MAX_QUEUE_SIZE = '10000',
	MS_METRICS = 'false',
	MS_METRICS_PORT = '9458',
	TRACING_ENABLED = 'false',
	SKIP_PROCESS_EVENT_REGISTRATION = 'false',
} = process.env;

const configuration: BrokerOptions = {
	namespace: MS_NAMESPACE,
	skipProcessEventRegistration: SKIP_PROCESS_EVENT_REGISTRATION === 'true',
	transporter: TRANSPORTER,
	metrics: {
		enabled: MS_METRICS === 'true',
		reporter: [
			{
				type: 'Prometheus',
				options: {
					port: MS_METRICS_PORT,
				},
			},
		],
	},
	cacher: CACHE,
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
	logLevel: 'error',
};

export class MoleculerDriver implements IInterProcessCommunicationDriver {
	private broker: ServiceBroker | null = null;

	public async connect(options: InterProcessCommunicationStartParams, logger: ILogger): Promise<void> {
		try {
			if (!this.broker) {
				this.broker = new ServiceBroker({
					...configuration,
					transporter: options.url || 'TCP',
					started(): void {
						logger.info('NetworkBroker started successfully.');
					},
				});
			}
			await this.broker.start();
		} catch (error) {
			logger.error(error as any);
		}
	}

	public getConnection<ServiceBroker>(): ServiceBroker {
		if (!this.broker) {
			throw new Error('Cannot retrieve a Moleculer connection, try to connect it first.');
		}

		return this.broker as ServiceBroker;
	}
}
