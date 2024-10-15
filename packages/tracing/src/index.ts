import { trace } from '@opentelemetry/api';
import type { Span, SpanOptions, Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { NodeSDK } from '@opentelemetry/sdk-node';

export { trace, context, propagation, ROOT_CONTEXT } from '@opentelemetry/api';
export { initDatabaseTracing } from './traceDatabaseCalls';

let tracer: Tracer;

export const startTracing = ({ service }: { service: string }) => {
	const exporter = new OTLPTraceExporter();

	const sdk = new NodeSDK({
		traceExporter: exporter,
		instrumentations: [],
		serviceName: service,
	});
	sdk.start();

	tracer = trace.getTracer(service);

	// return new TracingEnabled(service);
};

const enabled = true; // process.env.TRACING_ENABLED

type MaybePromise<T> = T | Promise<T>;

export function tracerSpan<F extends (span?: Span) => unknown>(name: string, options: SpanOptions, fn: F): MaybePromise<ReturnType<F>> {
	if (!enabled) {
		return fn() as MaybePromise<ReturnType<F>>;
	}

	return tracer.startActiveSpan(name, options, async (span: Span) => {
		const result = await fn(span);

		span.end();

		return result;
	}) as MaybePromise<ReturnType<F>>;
}
