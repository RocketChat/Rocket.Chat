import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { Resource } from '@opentelemetry/resources';
import { ConsoleLogRecordExporter, SimpleLogRecordProcessor, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export type OpenTelemetryStartParams = {
	service: { name: string };
	sendToConsole?: boolean;
}

export type OpenTelemetryExporterUrls = {
	traceExporterUrl: string;
	metricsExporterUrl: string;
	logExporterUrl: string;
}

export class OpenTelemetry {
	private sdk: NodeSDK;

	constructor({ service, sendToConsole, traceExporterUrl, metricsExporterUrl, logExporterUrl }: OpenTelemetryStartParams & OpenTelemetryExporterUrls) {
		if (sendToConsole) {
			this.sdk = new NodeSDK({
				resource: new Resource({
					[ATTR_SERVICE_NAME]: service.name,
				}),
				traceExporter: new ConsoleSpanExporter(),
				metricReader: new PeriodicExportingMetricReader({
					exporter: new ConsoleMetricExporter(),
				}),
				logRecordProcessor: new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
				spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
			});
			return;
		}

		this.sdk = new NodeSDK({
			resource: new Resource({
				[ATTR_SERVICE_NAME]: service.name,
			}),
			traceExporter: new OTLPTraceExporter({
				url: traceExporterUrl,
			}),
			logRecordProcessor: new BatchLogRecordProcessor(
				new OTLPLogExporter({
					url: logExporterUrl,
				}),
			),
			metricReader: new PeriodicExportingMetricReader({
				exporter: new OTLPMetricExporter({
					url: metricsExporterUrl,
				}),
				exportIntervalMillis: 10000,
			}),
			instrumentations: [
				new RuntimeNodeInstrumentation({
					eventLoopUtilizationMeasurementInterval: 5000,
				}),
			],
		});
	}

	public startSdk(): void {
		this.sdk.start();
	}
}
