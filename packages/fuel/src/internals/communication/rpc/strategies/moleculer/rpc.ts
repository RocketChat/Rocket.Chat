import { performance } from 'perf_hooks';

import type { Context, ServiceSchema, ServiceBroker } from 'moleculer';
import { Errors } from 'moleculer';

import { injectable } from '../../../../dependency-injection';
import type { ITracingSpan, ITracingCarrier, IMetrics, ITracing, ILogger } from '../../../../observability';
import {
	SEMATTRS_RPC_REQUEST_BODY,
	SEMATTRS_RPC_METHOD,
	SEMATTRS_RPC_SERVICE,
	SEMATTRS_RPC_RESPONSE_BODY,
} from '../../../../observability';
import type { IEnvelope } from '../../../definition';
import { AbstractMoleculerBroker } from '../../../drivers/moleculer';
import type { IInternalRPCClient } from '../../../messaging/definition';
import { ServiceError, ServiceNotFound, ServiceTimeout } from '../../errors';
import type { IInternalRPCAdapter, IInternalRPCServiceRegistrar } from '../definition';

export class MoleculerRPCRegistrar extends AbstractMoleculerBroker implements IInternalRPCServiceRegistrar {
	constructor(broker: ServiceBroker, public service: ServiceSchema, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {
		super(broker);
	}

	public async registerAction<TInput, TOutput>(action: string, handler: (input: TInput) => Promise<TOutput>): Promise<void> {
		if (!this.service.actions) {
			throw new Error('Invalid Moleculer service actions');
		}
		// https://github.com/moleculerjs/moleculer-repl/blob/master/src/commands/listener.js#L102
		await this.destroyServiceIfExists(this.service.name);
		await this.createService({
			...(this.service.schema || {}),
			...(this.service || {}),
			actions: {
				...(this.service.schema?.actions || this.service.actions || {}),
				[action]: async (ctx: Context<IEnvelope<TInput & ITracingCarrier>>): Promise<IEnvelope<TOutput>> => {
					const tracer = this.tracing.createTrace('Moleculer RPC Handler Trace');
					const metrics = this.metrics.createMetric('Moleculer RPC Handler Metric');
					const latencyHistogram = metrics.createHistogram({
						name: 'Moleculer_Handler_Latency',
						description: 'Metric to describe each Moleculer handler latency',
					});

					const { payload } = ctx.params;

					const actionName = ctx.action?.name || `moleculer-${this.service.name}-${ctx.id}`;
					const serviceName = ctx.service?.name || this.service.name;

					return tracer.startNestedOrCreateSpan<IEnvelope<TInput>, IEnvelope<TOutput>>(
						actionName,
						ctx.params,
						async (span: ITracingSpan) => {
							span.setAttribute(SEMATTRS_RPC_REQUEST_BODY, JSON.stringify(payload));
							span.setAttribute(SEMATTRS_RPC_METHOD, actionName);
							span.setAttribute(SEMATTRS_RPC_SERVICE, serviceName);
							span.addEvent('Starting handling Moleculer RPC request');
							const startTime = performance.now();
							try {
								const response = await handler(payload);

								span.setAttribute(SEMATTRS_RPC_RESPONSE_BODY, JSON.stringify(response));
								span.addEvent('Finishing handling Moleculer RPC request');
								this.logger.info(`Finishing handling Moleculer RPC request: ${this.service.name}-${action}`);
								this.logger.info(`Finishing handling Moleculer RPC request with body: ${JSON.stringify(payload)}`);
								const duration = performance.now() - startTime;
								latencyHistogram.record({ value: duration, attributes: { service: serviceName, action: actionName } });

								return { payload: response };
							} catch (error: any) {
								span.recordException(error);
								this.logger.error(`Finishing handling Moleculer RPC request with Error: ${this.service.name}-${action}`);
								this.logger.error(`Error: ${error}`);
								throw error;
							} finally {
								span.end();
							}
						},
					);
				},
			},
		});
		const service = await this.getLocalService(this.service.name);
		if (!service) {
			throw new Error(`Moleculer service: ${this.service.name} could not be recreated`);
		}
		this.service = service;
	}
}

@injectable()
export class MoleculerRPCAdapter extends AbstractMoleculerBroker implements IInternalRPCAdapter {
	constructor(protected broker: ServiceBroker, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {
		super(broker);
	}

	public async createRPCService(serviceName: string): Promise<IInternalRPCServiceRegistrar> {
		const service: ServiceSchema = {
			name: serviceName,
			actions: {},
			events: {},
		};

		return new MoleculerRPCRegistrar(this.broker, service, this.tracing, this.metrics, this.logger);
	}

	public async deleteRPCService(serviceName: string): Promise<void> {
		await this.destroyServiceIfExists(serviceName);
	}
}

@injectable()
export class MoleculerRPCClient extends AbstractMoleculerBroker implements IInternalRPCClient {
	constructor(protected broker: ServiceBroker, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {
		super(broker);
	}

	async send<TInput, TOutput>(serviceName: string, action: string, input: TInput): Promise<TOutput> {
		const tracer = this.tracing.createTrace('Moleculer RPC Caller Trace');
		const metrics = this.metrics.createMetric('Moleculer RPC Caller Metric');
		const latencyHistogram = metrics.createHistogram({
			name: 'Moleculer_Caller_Latency',
			description: 'Metric to describe each Moleculer caller latency',
		});

		return tracer.startNewSpan<TOutput>(`${serviceName}.${action}`, async (span: ITracingSpan) => {
			try {
				const envelope = { payload: input };
				span.setAttribute(SEMATTRS_RPC_REQUEST_BODY, JSON.stringify(envelope));
				span.setAttribute(SEMATTRS_RPC_METHOD, action);
				span.setAttribute(SEMATTRS_RPC_SERVICE, serviceName);
				span.addEvent('Calling Moleculer RPC request');
				const startTime = performance.now();
				const { payload } = await this.call<IEnvelope<TInput> & ITracingCarrier, IEnvelope<TOutput>>(
					serviceName,
					action,
					this.tracing.hydrateObjectForPropagation<IEnvelope<TInput>>(envelope),
				);

				span.setAttribute(SEMATTRS_RPC_RESPONSE_BODY, JSON.stringify(payload));
				span.addEvent('Finishing Moleculer RPC request');
				this.logger.info(`Finishing Moleculer RPC request: ${serviceName}-${action}-${JSON.stringify(envelope)}`);
				const duration = performance.now() - startTime;
				latencyHistogram.record({ value: duration, attributes: { service: serviceName, action } });

				return payload;
			} catch (error: any) {
				span.recordException(error);
				this.logger.error(`Finishing Moleculer RPC request with Error: ${serviceName}-${action}-${error}`);
				if (error instanceof Errors.ServiceNotFoundError || error instanceof Errors.ServiceNotAvailableError) {
					throw new ServiceNotFound();
				}
				if (error instanceof Errors.RequestTimeoutError) {
					throw new ServiceTimeout();
				}
				throw new ServiceError(error?.message || '');
			} finally {
				span.end();
			}
		});
	}
}
