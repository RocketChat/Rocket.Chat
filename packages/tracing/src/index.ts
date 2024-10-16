import { context, propagation, trace } from '@opentelemetry/api';
import type { Span, SpanOptions, Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { NodeSDK } from '@opentelemetry/sdk-node';

export { initDatabaseTracing } from './traceDatabaseCalls';

let tracer: Tracer;

export function isTracingEnabled() {
	return true; // TODO replace by ['yes', 'true'].includes(String(process.env.TRACING_ENABLED).toLowerCase());
}

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

export function tracerSpan<F extends (span?: Span) => ReturnType<F>>(
	name: string,
	options: SpanOptions,
	fn: F,
	optl?: unknown,
): ReturnType<F> {
	if (!isTracingEnabled()) {
		return fn();
	}

	if (optl) {
		const activeContext = propagation.extract(context.active(), optl);

		return tracer.startActiveSpan(name, options, activeContext, (span: Span) => {
			const result = fn(span);
			if (result instanceof Promise) {
				result.finally(() => {
					span.end();
				});
				return result;
			}
			span.end();
			return result;
		});
	}

	return tracer.startActiveSpan(name, options, (span: Span) => {
		const result = fn(span);
		if (result instanceof Promise) {
			result.finally(() => {
				span.end();
			});
			return result;
		}
		span.end();
		return result;
	});
}

export function tracerActiveSpan<F extends (span?: Span) => ReturnType<F>>(
	name: string,
	options: SpanOptions,
	fn: F,
	optl?: unknown,
): ReturnType<F> {
	const currentSpan = trace.getSpan(context.active());

	if (process.env.LOG_UNTRACED_METHODS) {
		console.log(`No active span for ${name}`, new Error().stack);
	}

	return currentSpan ? tracerSpan(name, options, fn, optl) : fn();
}

export function injectCurrentContext() {
	const output: Record<string, string> = {};
	propagation.inject(context.active(), output);
	return output;
}
