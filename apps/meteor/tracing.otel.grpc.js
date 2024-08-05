const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const opentelemetry = require('@opentelemetry/sdk-node');
// const { Resource } = require("@opentelemetry/resources")
// const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions")
// const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node")
// const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base")
// const opentelemetryAPI = require('@opentelemetry/api')

// const dotenv = require("dotenv")
// dotenv.config()

// const resource = Resource.default().merge(
//   new Resource({
//     [SemanticResourceAttributes.SERVICE_NAME]: "quick-start-nodejs-manual-instrumentation",
//     [SemanticResourceAttributes.SERVICE_VERSION]: "0.0.1",
//   })
// )

// const provider = new NodeTracerProvider({ resource: resource })
const exporter = new OTLPTraceExporter();
// const processor = new BatchSpanProcessor(exporter)
// provider.addSpanProcessor(processor)
// provider.register()

const sdk = new opentelemetry.NodeSDK({
	traceExporter: exporter,
	instrumentations: [
		getNodeAutoInstrumentations({
			'@opentelemetry/instrumentation-fs': {
				enabled: false,
			},
			'@opentelemetry/instrumentation-net': {
				enabled: false,
			},
			'@opentelemetry/instrumentation-express': {
				enabled: false,
			},
			'@opentelemetry/instrumentation-dns': {
				enabled: false,
			},
			'@opentelemetry/instrumentation-http': {
				enabled: false,
			},
			'@opentelemetry/instrumentation-connect': {
				enabled: false,
			},
			'@opentelemetry/instrumentation-mongodb': {
				enabled: true,
				enhancedDatabaseReporting: true,
				// responseHook: (span, response) => {
				// 	// console.log({ response });
				// 	// console.log({ response: JSON.stringify(response, null, 2) });
				// 	// span.setAttribute('mongodb.response', JSON.stringify(response));
				// 	span.updateName(span.name + ' ' + span.);
				// },
				// dbStatementSerializer: (operation, parameters) => {
				// 	return `${operation} ${parameters}`;
				// }
			},
		}),
	],
	serviceName: 'core',
});
sdk.start();
