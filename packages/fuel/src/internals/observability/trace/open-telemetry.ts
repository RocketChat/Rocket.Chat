import type { Span, Tracer } from '@opentelemetry/api';
import opentelemetry, { context, propagation, SpanKind, trace } from '@opentelemetry/api';

import { injectable } from '../../dependency-injection';
import type { ITracingSpan, ITracing, ITracer, ITracingCarrier } from './definition';

class SpanAdapter implements ITracingSpan {
	private isOpen = false;

	constructor(private span: Span) {
		this.isOpen = true;
	}

	public recordException(exception: any): void {
		this.span.recordException(exception);
	}

	public end(): void {
		this.span.end();
		this.isOpen = false;
	}

	public setAttribute(attr: string, value: string | number | boolean | Array<null | undefined | string>): void {
		this.span.setAttribute(attr, value);
	}

	public addEvent(
		name: string,
		attrOrTime?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date>,
		startTime?: Date,
	): void {
		this.span.addEvent(name, attrOrTime as any, startTime);
	}

	public isClosed(): boolean {
		return !this.isOpen;
	}
}

class TracerAdapter implements ITracer {
	constructor(private trace: Tracer) {}

	public async startNewSpan<T>(name: string, fn: (span: SpanAdapter) => Promise<T>): Promise<T> {
		return this.trace.startActiveSpan(name, { kind: SpanKind.SERVER }, async (span: Span) => {
			const spanAdapter = new SpanAdapter(span);
			const response = await fn(spanAdapter);
			if (!spanAdapter.isClosed()) {
				throw new Error('You must close tracing span after using it');
			}
			return response;
		});
	}

	public async startNewSpanAndKeepSpanOpen<T>(name: string, fn: (span: SpanAdapter) => Promise<T>): Promise<T> {
		return this.trace.startActiveSpan(name, { kind: SpanKind.SERVER }, async (span: Span) => {
			const spanAdapter = new SpanAdapter(span);
			return fn(spanAdapter);
		});
	}

	public startNewSpanForSyncFn<T>(name: string, fn: (span: SpanAdapter) => T): T {
		return this.trace.startActiveSpan(name, { kind: SpanKind.SERVER }, (span: Span) => {
			const spanAdapter = new SpanAdapter(span);
			const response = fn(spanAdapter);
			if (!spanAdapter.isClosed()) {
				throw new Error('You must close tracing span after using it');
			}
			return response;
		});
	}

	public async traceAsyncFnAutomatically<T>(name: string, fn: () => Promise<T>): Promise<T> {
		return this.trace.startActiveSpan(name, { kind: SpanKind.SERVER }, async (span: Span): Promise<T> => {
			try {
				return await fn();
			} catch (error: any) {
				span.recordException(error);
				throw error;
			} finally {
				span.end();
			}
		});
	}

	public async startNestedOrCreateSpan<TInput, TReturn>(
		name: string,
		dataWithTracingMetadata: TInput & { __metadata?: ITracingCarrier },
		fn: (span: SpanAdapter) => Promise<TReturn>,
	): Promise<TReturn> {
		let activeContext = context.active();
		if (dataWithTracingMetadata.__metadata) {
			activeContext = propagation.extract(context.active(), dataWithTracingMetadata.__metadata ?? {}, {
				get(h: any, k): any {
					return h[k];
				},
				keys(h) {
					return Object.keys(h);
				},
			});
		}

		return this.trace.startActiveSpan(name, { kind: SpanKind.SERVER }, activeContext, async (span: Span) => {
			trace.setSpan(activeContext, span);

			const spanAdapter = new SpanAdapter(span);
			const response = await fn(spanAdapter);
			if (!spanAdapter.isClosed()) {
				throw new Error('You must close tracing span after using it');
			}
			return response;
		});
	}
}

@injectable()
export class OpenTelemetryTracing implements ITracing {
	public createTrace(name: string): TracerAdapter {
		return new TracerAdapter(opentelemetry.trace.getTracer(name));
	}

	public hydrateObjectForPropagation<T>(data: T): T & ITracingCarrier {
		const output: Record<string, any> = {};
		propagation.inject(context.active(), output);
		const { traceparent, tracestate } = output;

		return {
			...data,
			__metadata: {
				tracestate,
				traceparent,
			},
		};
	}
}
