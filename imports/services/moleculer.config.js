// More info about options: https://moleculer.services/docs/0.13/broker.html#Broker-options
export default {
	namespace: '',
	nodeID: null,

	logger: true,
	logLevel: 'debug',
	logFormatter: 'default',
	logObjectPrinter: null,

	transporter: 'NATS',

	cacher: 'Memory',

	serializer: 'JSON',

	requestTimeout: 10 * 1000,
	retryPolicy: {
		enabled: false,
		retries: 5,
		delay: 100,
		maxDelay: 1000,
		factor: 2,
		check: (err) => err && !!err.retryable,
	},

	maxCallLevel: 100,
	heartbeatInterval: 5,
	heartbeatTimeout: 15,

	tracking: {
		enabled: false,
		shutdownTimeout: 5000,
	},

	disableBalancer: false,

	registry: {
		strategy: 'RoundRobin',
		preferLocal: true,
	},

	circuitBreaker: {
		enabled: false,
		threshold: 0.5,
		windowTime: 60,
		minRequestCount: 20,
		halfOpenTime: 10 * 1000,
		check: (err) => err && err.code >= 500,
	},

	bulkhead: {
		enabled: false,
		concurrency: 10,
		maxQueueSize: 100,
	},

	validation: true,
	validator: null,

	metrics: false,
	metricsRate: 1,

	internalServices: true,
	internalMiddlewares: true,

	hotReload: false,

	// Register custom middlewares
	middlewares: [],

	// Called after broker created.
	created(/* broker*/) {

	},

	// Called after broker starte.
	started(/* broker*/) {

	},

	// Called after broker stopped.
	stopped(/* broker*/) {

	},

	replCommands: null,
};
