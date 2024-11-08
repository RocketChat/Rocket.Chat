import { performance } from 'perf_hooks';

import type { Context, ServiceBroker } from 'moleculer';

import { injectable } from '../../../../../dependency-injection';
import { SEMATTRS_EPHEMERAL_EVENT_BODY, SEMATTRS_EPHEMERAL_EVENT_NAME } from '../../../../../observability';
import type { ITracingSpan, IMetrics, ITracing, ILogger } from '../../../../../observability';
import type { IEnvelope } from '../../../../definition';
import { AbstractMoleculerBroker } from '../../../../drivers/moleculer';
import { MoleculerRPCRegistrar } from '../../../../rpc/strategies/moleculer/rpc';
import type { CancellableEvent, IInternalEphemeralMessagingClient, IInternalEphemeralMessagingRegistrar, PublishableEvent } from '../../../definition';

@injectable()
export class MoleculerEphemeralMessagingRegistrar extends AbstractMoleculerBroker implements IInternalEphemeralMessagingRegistrar {
	constructor(protected broker: ServiceBroker, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {
		super(broker);
	}

	public async registerConsumer<TInput extends object>(
		eventName: string,
		handler: (input: PublishableEvent<TInput>) => Promise<void>,
		extras: MoleculerRPCRegistrar,
	): Promise<CancellableEvent> {
		if (!extras || !(extras instanceof MoleculerRPCRegistrar)) {
			throw new Error('Service instance must be provided when using Moleculer as the event provider.');
		}
		const serviceName = extras.service.name;
		const service = await this.getLocalService(serviceName);
		if (!service) {
			throw new Error(`Moleculer service: ${serviceName} does not exist`);
		}
		if (!service.schema.events) {
			throw new Error(`Moleculer service: ${serviceName} does not support events`);
		}

		// https://github.com/moleculerjs/moleculer-repl/blob/master/src/commands/listener.js#L102
		await this.destroyServiceIfExists(serviceName);
		await this.createService({
			...service.schema,
			events: {
				...service.schema.events,
				[eventName]: async (ctx: Context<IEnvelope<PublishableEvent<TInput>>>) => {
					const tracer = this.tracing.createTrace('Moleculer Event Handler Trace');
					const metrics = this.metrics.createMetric('Moleculer Event Handler Metrics');
					const latencyHistogram = metrics.createHistogram({
						name: 'Moleculer_Event_Handler_Latency',
						description: 'Metric to describe each In Moleculer Event Handler latency',
					});

					const { payload } = ctx.params;

					void tracer.startNestedOrCreateSpan<IEnvelope<PublishableEvent<TInput>>, void>(eventName, ctx.params, async (span: ITracingSpan) => {
						span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_BODY, JSON.stringify(payload));
						span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_NAME, eventName);
						span.addEvent('Starting handling Moleculer Event');
						try {
							const startTime = performance.now();

							await handler(payload);

							const duration = performance.now() - startTime;
							span.addEvent('Finishing handling Moleculer Event');
							latencyHistogram.record({ value: duration, attributes: { event: eventName } });
							this.logger.info(`Finishing handling Moleculer Event: ${eventName}-${JSON.stringify(payload)}`);
						} catch (error: any) {
							span.recordException(error);
							this.logger.error(`Finishing handling Moleculer Event with error: ${eventName}-${error}`);
							throw error;
						} finally {
							span.end();
						}
					});
				},
			},
		});

		return {
			cancel: async (): Promise<void> => {
				const existingService = await this.getLocalService(service.name);
				if (!existingService) {
					throw new Error(`Moleculer service: "${service.name}" does not exist`);
				}
				const { events } = existingService.schema;
				if (!events) {
					throw new Error(`Moleculer events for service: ${service.name} does not exist`);
				}

				const withoutEvent = Object.keys(events || {})
					.filter((event) => event !== eventName)
					.reduce((acc, key) => {
						acc[key] = events[key];

						return acc;
					}, {} as Record<string, any>);

				// https://github.com/moleculerjs/moleculer-repl/blob/master/src/commands/listener.js#L102
				await this.destroyServiceIfExists(service.name);
				await this.createService({
					...service.schema,
					events: {
						...withoutEvent,
					},
				});
			},
		};
	}
}

@injectable()
export class MoleculerEphemeralMessagingClient extends AbstractMoleculerBroker implements IInternalEphemeralMessagingClient {
	constructor(protected broker: ServiceBroker, private tracing: ITracing, private logger: ILogger) {
		super(broker);
	}

	public async emit<TInput extends object>(eventName: string, input: PublishableEvent<TInput>): Promise<void> {
		const tracer = this.tracing.createTrace('Moleculer Event Dispatcher Trace');
		const envelope = { payload: input };

		return tracer.startNewSpan<void>(eventName, async (span: ITracingSpan) => {
			try {
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_BODY, JSON.stringify(envelope));
				span.setAttribute(SEMATTRS_EPHEMERAL_EVENT_NAME, eventName);
				this.logger.error(`Finishing Moleculer Event Emit: ${eventName}-${envelope}`);

				return this.broadcast<IEnvelope<PublishableEvent<TInput>>>(eventName, this.tracing.hydrateObjectForPropagation<IEnvelope<PublishableEvent<TInput>>>(envelope));
			} catch (error: any) {
				span.recordException(error);
				this.logger.error(`Finishing Moleculer Emit with error: ${error}`);
				throw error;
			} finally {
				span.end();
			}
		});
	}
}
