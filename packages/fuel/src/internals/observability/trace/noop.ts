import type { ITracingSpan, ITracing, ITracer, ITracingCarrier } from './definition';
import { injectable } from '../../dependency-injection';

class NoopSpanAdapter implements ITracingSpan {
	public recordException(): void {
		// noop
	}

	public end(): void {
		// noop
	}

	public setAttribute(): void {
		// noop
	}

	public addEvent(): void {
		// noop
	}
}

class NoopTracerAdapter implements ITracer {
	public async startNewSpan<T>(_: string, fn: (_: NoopSpanAdapter) => Promise<T>): Promise<T> {
		return fn(new NoopSpanAdapter());
	}

	public async startNewSpanAndKeepSpanOpen<T>(_: string, fn: (_: ITracingSpan) => Promise<T>): Promise<T> {
		return fn(new NoopSpanAdapter());
	}

	public async traceAsyncFnAutomatically<T>(_: string, fn: () => Promise<T>): Promise<T> {
		return fn();
	}

	public startNewSpanForSyncFn<T>(_: string, fn: (_: ITracingSpan) => T): T {
		return fn(new NoopSpanAdapter());
	}

	public async startNestedOrCreateSpan<TInput, TReturn>(
		_: string,
		_dataWithTracingMetadata: TInput & { __metadata?: ITracingCarrier },
		fn: (span: NoopSpanAdapter) => Promise<TReturn>,
	): Promise<TReturn> {
		return fn(new NoopSpanAdapter());
	}
}

@injectable()
export class NoopTracingAdapter implements ITracing {
	public createTrace(): ITracer {
		return new NoopTracerAdapter();
	}

	public hydrateObjectForPropagation<T>(data: T): T & ITracingCarrier {
		const output: ITracingCarrier = {
			__metadata: {},
		};

		return {
			...data,
			...output,
		};
	}
}
