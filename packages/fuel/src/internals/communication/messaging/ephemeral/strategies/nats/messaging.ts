import { performance } from 'perf_hooks';

import type { NatsConnection, Msg, NatsError } from 'nats';

import { injectable } from '../../../../../dependency-injection';
import type { ITracingSpan, IMetrics, ITracing, ILogger } from '../../../../../observability';
import { SEMATTRS_EPHEMERAL_EVENT_BODY, SEMATTRS_EPHEMERAL_EVENT_NAME } from '../../../../../observability';
import type { IEnvelope } from '../../../../definition';
import type { IInternalRPCServiceRegistrar } from '../../../../rpc/strategies/definition';
import type { CancellableEvent, IInternalEphemeralMessagingClient, IInternalEphemeralMessagingRegistrar, PublishableEvent } from '../../../definition';

@injectable()
export class NatsEphemeralMessagingRegistrar implements IInternalEphemeralMessagingRegistrar {
	constructor(private connection: NatsConnection, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {}

	public async registerConsumer<TInput extends object>(
		eventName: string,
		handler: (input: PublishableEvent<TInput>) => Promise<void>,
		_: IInternalRPCServiceRegistrar,
	): Promise<CancellableEvent> {
		const subscription = this.connection.subscribe(eventName, {
			callback: (err: NatsError | null, message: Msg): void => {
				const tracer = this.tracing.createTrace('NATS Event Handler Trace');
				const metrics = this.metrics.createMetric('NATS Event Handler Metrics');
				const latencyHistogram = metrics.createHistogram({
					name: 'NATS_Event_Handler_Latency',
					description: 'Metric to describe each In NATS Event Handler latency',
				});
				if (err) {
					throw err;
				}

				const envelope = message.json<IEnvelope<PublishableEvent<TInput>>>();
				const { payload } = envelope;

				void tracer.startNestedOrCreateSpan<IEnvelope<PublishableEvent<TInput>>, void>(eventName, envelope, async (span: ITracingSpan) => {
					span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_BODY, JSON.stringify(payload));
					span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_NAME, eventName);
					span.addEvent('Starting handling NATS Event');
					try {
						const startTime = performance.now();

						await handler(payload);

						const duration = performance.now() - startTime;
						span.addEvent('Finishing handling NATS Event');
						latencyHistogram.record({ value: duration, attributes: { event: eventName } });
						this.logger.info(`Finishing handling NATS Event: ${eventName}-${JSON.stringify(payload)}`);
					} catch (error: any) {
						span.recordException(error);
						this.logger.error(`Finishing handling NATS Event with error: ${eventName}-${error}`);
						throw error;
					} finally {
						span.end();
					}
				});
			},
		});

		return {
			cancel: async () => subscription.unsubscribe(),
		};
	}
}

@injectable()
export class NatsEphemeralMessagingClient implements IInternalEphemeralMessagingClient {
	constructor(private connection: NatsConnection, private tracing: ITracing, private logger: ILogger) {}

	public async emit<TInput extends object>(eventName: string, input: PublishableEvent<TInput>): Promise<void> {
		const tracer = this.tracing.createTrace('NATS Event Dispatcher Trace');
		const envelope = { payload: input };
		return tracer.startNewSpan<void>(eventName, async (span: ITracingSpan) => {
			try {
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_BODY, JSON.stringify(envelope));
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_NAME, eventName);
				this.logger.error(`Finishing NATS Event Emit: ${eventName}-${envelope}`);

				return this.connection.publish(eventName, JSON.stringify(this.tracing.hydrateObjectForPropagation<IEnvelope<PublishableEvent<TInput>>>(envelope)));
			} catch (error: any) {
				span.recordException(error);
				this.logger.error(`Finishing NATS Emit with error: ${error}`);
				throw error;
			} finally {
				span.end();
			}
		});
	}
}
