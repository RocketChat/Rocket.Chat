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
	SKIP_PROCESS_EVENT_REGISTRATION = 'false',
} = process.env;

// only starts network broker if transporter properly configured
if (TRANSPORTER.match(/^(?:nats|TCP)/)) {
	(async (): Promise<void> => {
		const { ServiceBroker, Serializers } = await import('moleculer');
		const EJSON = (await import('ejson')).default;

		const { NetworkBroker } = await import('./NetworkBroker');
		const { api } = await import('../../server/sdk/api');
		const Base = Serializers.Base as unknown as new () => {};

		class EJSONSerializer extends Base {
			serialize(obj: {}): Buffer {
				return Buffer.from(EJSON.stringify(obj));
			}

			deserialize(buf: Buffer): any {
				return EJSON.parse(buf.toString());
			}
		}

		const network = new ServiceBroker({
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

		api.setBroker(new NetworkBroker(network));
	})();
}
