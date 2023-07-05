import EJSON from 'ejson';
import { Errors, Serializers, ServiceBroker } from 'moleculer';
import { pino } from 'pino';
import { isMeteorError, MeteorError } from '@rocket.chat/core-services';
import { config } from '@rocket.chat/config';

import { NetworkBroker } from '../NetworkBroker';

const {
	MS_NAMESPACE,
	TRANSPORTER,
	CACHE,
	// SERIALIZER = 'MsgPack',
	SERIALIZER,
	MOLECULER_LOG_LEVEL,
	BALANCE_STRATEGY,
	BALANCE_PREFER_LOCAL,
	RETRY_FACTOR,
	RETRY_MAX_DELAY,
	RETRY_DELAY,
	RETRY_RETRIES,
	RETRY_ENABLED,
	REQUEST_TIMEOUT,
	HEARTBEAT_INTERVAL,
	HEARTBEAT_TIMEOUT,
	BULKHEAD_ENABLED,
	BULKHEAD_CONCURRENCY,
	BULKHEAD_MAX_QUEUE_SIZE,
	MS_METRICS,
	MS_METRICS_PORT,
	TRACING_ENABLED,
	SKIP_PROCESS_EVENT_REGISTRATION,
} = config;

const { Base } = Serializers;

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
	serialize(obj: any): Buffer {
		return Buffer.from(EJSON.stringify(obj));
	}

	deserialize(buf: Buffer): any {
		return EJSON.parse(buf.toString());
	}
}

const network = new ServiceBroker({
	namespace: MS_NAMESPACE,
	skipProcessEventRegistration: SKIP_PROCESS_EVENT_REGISTRATION,
	transporter: TRANSPORTER,
	metrics: {
		enabled: MS_METRICS,
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
					...(!config.isProduction
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
		preferLocal: BALANCE_PREFER_LOCAL !== false,
	},

	requestTimeout: REQUEST_TIMEOUT * 1000,
	retryPolicy: {
		enabled: RETRY_ENABLED,
		retries: RETRY_RETRIES,
		delay: RETRY_DELAY,
		maxDelay: RETRY_MAX_DELAY,
		factor: RETRY_FACTOR,
		check: (err: any): boolean => err && !!err.retryable,
	},

	maxCallLevel: 100,
	heartbeatInterval: HEARTBEAT_INTERVAL,
	heartbeatTimeout: HEARTBEAT_TIMEOUT,

	// circuitBreaker: {
	// 	enabled: false,
	// 	threshold: 0.5,
	// 	windowTime: 60,
	// 	minRequestCount: 20,
	// 	halfOpenTime: 10 * 1000,
	// 	check: (err: any): boolean => err && err.code >= 500,
	// },

	bulkhead: {
		enabled: BULKHEAD_ENABLED,
		concurrency: BULKHEAD_CONCURRENCY,
		maxQueueSize: BULKHEAD_MAX_QUEUE_SIZE,
	},

	tracing: {
		enabled: TRACING_ENABLED,
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

export const broker = new NetworkBroker(network);
