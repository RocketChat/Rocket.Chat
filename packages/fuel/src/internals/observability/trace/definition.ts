export interface ITracingCarrier {
	__metadata: {
		traceparent?: string;
		tracestate?: string;
	};
}

export interface ITracingSpan {
	recordException(exception: any): void;
	setAttribute(attr: string, value: string | number | boolean | Array<null | undefined | string>): void;
	end(): void;
	addEvent(
		name: string,
		attrOrTime?: Record<string, (string | number | boolean | Array<null | undefined | string>) | Date>,
		startTime?: Date,
	): void;
}

export interface ITracer {
	startNewSpan<T>(name: string, fn: (span: ITracingSpan) => Promise<T>): Promise<T>;
	startNewSpanAndKeepSpanOpen<T>(name: string, fn: (span: ITracingSpan) => Promise<T>): Promise<T>;
	startNewSpanForSyncFn<T>(name: string, fn: (span: ITracingSpan) => T): T;
	traceAsyncFnAutomatically<T>(name: string, fn: () => Promise<T>): Promise<T>;
	startNestedOrCreateSpan<TInput, TReturn>(
		name: string,
		dataWithTracingMetadata: TInput & { __metadata?: ITracingCarrier },
		fn: (span: ITracingSpan) => Promise<TReturn>,
	): Promise<TReturn>;
}

export interface ITracing {
	createTrace(name: string): ITracer;
	hydrateObjectForPropagation<T>(data: T): T & ITracingCarrier;
}
