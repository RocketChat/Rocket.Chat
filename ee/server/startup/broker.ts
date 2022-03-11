import EJSON from 'ejson';
import { Errors, Serializers, ServiceBroker } from 'moleculer';
import { pino } from 'pino';

import { api } from '../../../server/sdk/api';
import { isMeteorError, MeteorError } from '../../../server/sdk/errors';
import { NetworkBroker } from '../NetworkBroker';

const {
	MS_NAMESPACE = '',
	TRANSPORTER = '',
	CACHE = 'Memory',
	// SERIALIZER = 'MsgPack',
	SERIALIZER = 'EJSON',
	MOLECULER_LOG_LEVEL = 'warn',
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
	SKIP_PROCESS_EVENT_REGISTRATION = 'false',
} = process.env;

const Base = Serializers.Base as unknown as new () => {};
class CustomRegenerator extends Errors.Regenerator {
	restoreCustomError(plainError: any): Error | undefined {
		const { message, reason, details, errorType, isClientSafe } = plainError;

		if (errorType === 'Meteor.Error') {
			const error = new MeteorError(message, reason, details);
			if (typeof isClientSafe !== 'undefined') {
				error.isClientSafe = isClientSafe;
			}
			return error;
		}

		return undefined;
	}

	extractPlainError(err: Error | MeteorError): Errors.PlainMoleculerError {
		return {
			...super.extractPlainError(err),
			...(isMeteorError(err) && {
				isClientSafe: err.isClientSafe,
				errorType: err.errorType,
				reason: err.reason,
				details: err.details,
			}),
		};
	}
}

class EJSONSerializer extends Base {
	serialize(obj: {}): Buffer {
		return Buffer.from(EJSON.stringify(obj));
	}

	deserialize(buf: Buffer): any {
		return EJSON.parse(buf.toString());
	}
}

const network = new ServiceBroker({
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
	serializer: SERIALIZER === 'EJSON' ? new EJSONSerializer() : SERIALIZER,
	logger: {
		type: 'Pino',
		options: {
			level: MOLECULER_LOG_LEVEL,
			pino: {
				options: {
					timestamp: pino.stdTimeFunctions.isoTime,
					...(process.env.NODE_ENV !== 'production'
						? {
								transport: {
									target: 'pino-pretty',
									options: {
										colorize: true,
									},
								},
						  }
						: {}),
				},
			},
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
	errorRegenerator: new CustomRegenerator(),
	started(): void {
		console.log('NetworkBroker started successfully.');
	},
});

api.setBroker(new NetworkBroker(network));
