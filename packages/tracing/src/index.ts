import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Span, SpanOptions, Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import type { MongoClient } from 'mongodb';

import { initDatabaseTracing } from './traceDatabaseCalls';

let tracer: Tracer | undefined;

export * from './traceInstanceMethods';

export function isTracingEnabled() {
	return ['yes', 'true'].includes(String(process.env.TRACING_ENABLED).toLowerCase());
}

export const startTracing = ({ service, db }: { service: string; db: MongoClient }) => {
	if (!isTracingEnabled()) {
		return;
	}

	const exporter = new OTLPTraceExporter();

	const sdk = new NodeSDK({
		traceExporter: exporter,
		instrumentations: [],
		serviceName: service,
		spanProcessors: [new BatchSpanProcessor(exporter)],
	});
	sdk.start();

	tracer = trace.getTracer(service);

	initDatabaseTracing(tracer, db);
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

	if (!tracer) {
		throw new Error(`Tracing is enabled but not started. You should call 'startTracing()' to fix this.`);
	}

	const computeResult = (span: Span) => {
		try {
			const result = fn(span);
			if (result instanceof Promise) {
				result
					.catch((err) => {
						span.recordException(err);
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: err.message,
						});
					})
					.finally(() => span.end());

				return result;
			}

			span.end();
			return result;
		} catch (err: any) {
			span.recordException(err);
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: err.message,
			});
			span.end();
			throw err;
		}
	};

	if (optl) {
		const activeContext = propagation.extract(context.active(), optl);

		return tracer.startActiveSpan(name, options, activeContext, computeResult);
	}

	return tracer.startActiveSpan(name, options, computeResult);
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
