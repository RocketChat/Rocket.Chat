import { performance } from 'perf_hooks';

import { injectable } from '../../../../../dependency-injection';
import type { ITracingSpan, IMetrics, ITracing, ILogger } from '../../../../../observability';
import { SEMATTRS_EPHEMERAL_EVENT_BODY, SEMATTRS_EPHEMERAL_EVENT_NAME } from '../../../../../observability';
import type { IEnvelope } from '../../../../definition';
import type { IInternalRPCServiceRegistrar } from '../../../../rpc/strategies/definition';
import type { CancellableEvent, IInternalEphemeralMessagingClient, IInternalEphemeralMessagingRegistrar, PublishableEvent } from '../../../definition';
import { EVENT_STORAGE } from './storage';

@injectable()
export class InMemoryEphemeralMessagingRegistrar implements IInternalEphemeralMessagingRegistrar {
	private storage = EVENT_STORAGE;

	constructor(private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {}

	public async registerConsumer<TInput extends object>(
		eventName: string,
		handler: (input: PublishableEvent<TInput>) => Promise<void>,
		_: IInternalRPCServiceRegistrar,
	): Promise<CancellableEvent> {
		const fn = async (params: IEnvelope<PublishableEvent<TInput>>): Promise<void> => {
			const tracer = this.tracing.createTrace('In Memory Event Handler Trace');
			const metrics = this.metrics.createMetric('In Memory Event Handler Metrics');
			const latencyHistogram = metrics.createHistogram({
				name: 'In_Memory_Event_Handler_Latency',
				description: 'Metric to describe each In In Memory Event Handler latency',
			});

			const { payload } = params;

			void tracer.startNestedOrCreateSpan<IEnvelope<PublishableEvent<TInput>>, void>(eventName, params, async (span: ITracingSpan) => {
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_BODY, JSON.stringify(payload));
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_NAME, eventName);
				span.addEvent('Starting handling In Memory Event');
				try {
					const startTime = performance.now();

					await handler(payload);

					const duration = performance.now() - startTime;
					span.addEvent('Finishing handling In Memory Event');
					latencyHistogram.record({ value: duration, attributes: { event: eventName } });
					this.logger.info(`Finishing handling In Memory Event: ${eventName}-${JSON.stringify(payload)}`);
				} catch (error: any) {
					span.recordException(error);
					this.logger.error(`Finishing handling In Memory Event with error: ${error}`);
					throw error;
				} finally {
					span.end();
				}
			});
		};
		this.storage.on(eventName, fn);

		return {
			cancel: async (): Promise<void> => {
				this.storage.removeListener(eventName, fn);
			},
		};
	}
}
@injectable()
export class InMemoryEphemeralMessagingClient implements IInternalEphemeralMessagingClient {
	private storage = EVENT_STORAGE;

	constructor(private tracing: ITracing, private logger: ILogger) {}

	public async emit<TInput extends object>(eventName: string, input: PublishableEvent<TInput>): Promise<void> {
		const tracer = this.tracing.createTrace('In Memory Event Dispatcher Trace');
		const envelope = { payload: input };

		return tracer.startNewSpan<void>(eventName, async (span: ITracingSpan) => {
			try {
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_BODY, JSON.stringify(envelope));
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_NAME, eventName);

				this.storage.emit(eventName, this.tracing.hydrateObjectForPropagation<IEnvelope<PublishableEvent<TInput>>>(envelope));
				this.logger.error(`Finishing In Memory Event Emit: ${eventName}-${envelope}`);
			} catch (error: any) {
				this.logger.error(`Finishing In Memory Event Emit with error: ${error}`);
				span.recordException(error);
				throw error;
			} finally {
				span.end();
			}
		});
	}
}
