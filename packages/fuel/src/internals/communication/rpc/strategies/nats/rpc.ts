import { performance } from 'perf_hooks';

import type { NatsError, Service, ServiceGroup, ServiceMsg, NatsConnection } from 'nats';
import { ErrorCode } from 'nats';

import { injectable } from '../../../../dependency-injection';
import {
	SEMATTRS_RPC_METHOD,
	SEMATTRS_RPC_REQUEST_BODY,
	SEMATTRS_RPC_RESPONSE_BODY,
	SEMATTRS_RPC_SERVICE,
} from '../../../../observability';
import type { ITracingSpan, IMetrics, ITracing, ILogger } from '../../../../observability';
import type { IEnvelope } from '../../../definition';
import type { IInternalRPCClient } from '../../../messaging/definition';
import { ServiceError, ServiceNotFound, ServiceTimeout } from '../../errors';
import type { IInternalRPCAdapter, IInternalRPCServiceRegistrar } from '../definition';
import { services } from './storage';

export class NatsRPCRegistrar implements IInternalRPCServiceRegistrar {
	protected subject: ServiceGroup;

	constructor(private service: Service, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {
		this.subject = service.addGroup(service.info().name);

		services.set(service.info().name, service);
	}

	public async registerAction<TInput, TOutput>(action: string, handler: (input: TInput) => Promise<TOutput>): Promise<void> {
		this.subject.addEndpoint(action, {
			handler: (err: NatsError | null, message: ServiceMsg) => {
				const tracer = this.tracing.createTrace('NATS RPC Handler Trace');
				const metrics = this.metrics.createMetric('NATS RPC Handler Metric');
				const latencyHistogram = metrics.createHistogram({
					name: 'NATS_Handler_Latency',
					description: 'Metric to describe each NATS handler latency',
				});
				if (err) {
					throw err;
				}
				const envelope = message.json<IEnvelope<TInput>>();
				const serviceName = this.service.info().name;

				void tracer.startNestedOrCreateSpan<IEnvelope<TInput>, void>(action, envelope, async (span: ITracingSpan) => {
					try {
						const { payload } = envelope;
						span.setAttribute(SEMATTRS_RPC_REQUEST_BODY, JSON.stringify(payload));
						span.setAttribute(SEMATTRS_RPC_METHOD, action);
						span.setAttribute(SEMATTRS_RPC_SERVICE, serviceName);
						span.addEvent('Starting handling NATS RPC request');
						const startTime = performance.now();
						const response = await handler(payload);

						span.setAttribute(SEMATTRS_RPC_RESPONSE_BODY, JSON.stringify(response));
						span.addEvent('Finishing handling NATS RPC request');
						this.logger.info(`Finishing handling NATS RPC request: ${serviceName}-${action}-${JSON.stringify(payload)}`);
						const duration = performance.now() - startTime;
						latencyHistogram.record({ value: duration, attributes: { service: serviceName, action } });

						message.respond(JSON.stringify({ payload: response }));
					} catch (error: any) {
						span.recordException(error);
						throw error;
					} finally {
						span.end();
					}
				});
			},
		});
	}
}

@injectable()
export class NatsRPCAdapter implements IInternalRPCAdapter {
	constructor(private connection: NatsConnection, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) { }

	public async createRPCService(serviceName: string): Promise<IInternalRPCServiceRegistrar> {
		const service = await this.connection.services.add({
			name: serviceName,
			version: '0.0.1',
		});

		return new NatsRPCRegistrar(service, this.tracing, this.metrics, this.logger);
	}

	public async deleteRPCService(serviceName: string): Promise<void> {
		const service = services.get(serviceName);
		if (!service) {
			throw new Error(`Service ${serviceName} does not exist`);
		}
		await service.stop();
	}
}

@injectable()
export class NatsRPCClient implements IInternalRPCClient {
	constructor(private connection: NatsConnection, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) { }

	async send<TInput, TOutput>(serviceName: string, action: string, input: TInput): Promise<TOutput> {
		const tracer = this.tracing.createTrace('NATS RPC Caller Trace');
		const metrics = this.metrics.createMetric('NATS RPC Caller Metric');
		const latencyHistogram = metrics.createHistogram({
			name: 'NATS_Caller_Latency',
			description: 'Metric to describe each NATS caller latency',
		});

		return tracer.startNewSpan<TOutput>(`${serviceName}.${action}`, async (span: ITracingSpan) => {
			try {
				const envelope = { payload: input };
				span.setAttribute(SEMATTRS_RPC_REQUEST_BODY, JSON.stringify(envelope));
				span.setAttribute(SEMATTRS_RPC_METHOD, action);
				span.setAttribute(SEMATTRS_RPC_SERVICE, serviceName);
				span.addEvent('Calling NATS RPC request');
				const startTime = performance.now();
				const response = await this.connection.request(`${serviceName}.${action}`, JSON.stringify(this.tracing.hydrateObjectForPropagation<IEnvelope<TInput>>(envelope)));

				const { payload } = response.json<IEnvelope<TOutput>>();

				span.setAttribute(SEMATTRS_RPC_RESPONSE_BODY, JSON.stringify(payload));
				span.addEvent('Finishing NATS RPC request');
				this.logger.info(`Finishing NATS RPC request: ${serviceName}-${action}`);
				this.logger.info(`Finishing NATS RPC request with body: ${JSON.stringify(envelope)}`);
				const duration = performance.now() - startTime;
				latencyHistogram.record({ value: duration, attributes: { service: serviceName, action } });

				return payload;
			} catch (error: any) {
				this.logger.error(`Finishing NATS RPC request with Error: ${serviceName}-${action}`);
				this.logger.error(`Error: ${error}`);
				span.recordException(error);
				if (error.code === ErrorCode.NoResponders) {
					throw new ServiceNotFound();
				}
				if (error.code === ErrorCode.Timeout) {
					throw new ServiceTimeout();
				}
				throw new ServiceError(error?.message || '');
			} finally {
				span.end();
			}
		});
	}
}
