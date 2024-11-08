import { performance } from 'perf_hooks';

import { injectable, inject, FUEL_DI_TOKENS } from '../../../../dependency-injection';
import type { ITracingSpan, IMetrics, ITracing, ILogger } from '../../../../observability';
import {
	SEMATTRS_RPC_METHOD,
	SEMATTRS_RPC_REQUEST_BODY,
	SEMATTRS_RPC_RESPONSE_BODY,
	SEMATTRS_RPC_SERVICE,
} from '../../../../observability';
import type { IEnvelope } from '../../../definition';
import type { IInternalRPCClient } from '../../../messaging/definition';
import { ServiceError, ServiceNotFound } from '../../errors';
import type { IInternalRPCAdapter, IInternalRPCServiceRegistrar } from '../definition';
import { RPC_STORAGE } from './storage';

class InMemoryRPCRegistrar implements IInternalRPCServiceRegistrar {
	private serviceName: string;

	private storage = RPC_STORAGE;

	constructor(serviceName: string, private tracing: ITracing, private metrics: IMetrics, private logger: ILogger) {
		this.serviceName = serviceName;
		this.storage.createService(serviceName);
	}

	public async registerAction<TInput, TOutput>(action: string, handler: (input: TInput) => Promise<TOutput>): Promise<void> {
		await this.storage.registerServiceAction<TInput, TOutput>(this.serviceName, action, async (input: IEnvelope<TInput>) => {
			const tracer = this.tracing.createTrace('In Memory RPC Handler Trace');
			const metrics = this.metrics.createMetric('In Memory RPC Handler Metrics');
			const latencyHistogram = metrics.createHistogram({
				name: 'In_Memory_Handler_Latency',
				description: 'Metric to describe each In Memory handler latency',
			});

			const { payload } = input;
			return tracer.startNestedOrCreateSpan<IEnvelope<TInput>, IEnvelope<TOutput>>(action, input, async (span: ITracingSpan) => {
				try {
					span.setAttribute(SEMATTRS_RPC_REQUEST_BODY, JSON.stringify(payload));
					span.setAttribute(SEMATTRS_RPC_METHOD, action);
					span.setAttribute(SEMATTRS_RPC_SERVICE, this.serviceName);
					span.addEvent('Starting handling In Memory RPC request');
					const startTime = performance.now();
					const response = await handler(payload);

					span.setAttribute(SEMATTRS_RPC_RESPONSE_BODY, JSON.stringify(response));
					span.addEvent('Finishing handling In Memory RPC request');
					this.logger.info(`Finishing handling In Memory RPC request: ${this.serviceName}-${action}`);
					this.logger.info(`Finishing handling In Memory RPC request with body: ${JSON.stringify(payload)}`);
					const duration = performance.now() - startTime;
					latencyHistogram.record({ value: duration, attributes: { service: this.serviceName, action } });

					return { payload: response };
				} catch (error: any) {
					span.recordException(error);
					this.logger.error(`Finishing handling In Memory RPC request with Error: ${this.serviceName}-${action}`);
					this.logger.error(`Error: ${error}`);
					throw error;
				} finally {
					span.end();
				}
			});
		});
	}
}

@injectable()
export class InMemoryRPCAdapter implements IInternalRPCAdapter {
	constructor(
		@inject(FUEL_DI_TOKENS.TRACING) private tracing: ITracing,
		@inject(FUEL_DI_TOKENS.METRICS) private metrics: IMetrics,
		@inject(FUEL_DI_TOKENS.LOGGER) private logger: ILogger,
	) {}

	public async createRPCService(serviceName: string): Promise<IInternalRPCServiceRegistrar> {
		return new InMemoryRPCRegistrar(serviceName, this.tracing, this.metrics, this.logger);
	}

	public async deleteRPCService(serviceName: string): Promise<void> {
		RPC_STORAGE.deleteService(serviceName);
	}
}

@injectable()
export class InMemoryRPCClient implements IInternalRPCClient {
	private storage = RPC_STORAGE;

	constructor(
		@inject(FUEL_DI_TOKENS.TRACING) private tracing: ITracing,
		@inject(FUEL_DI_TOKENS.METRICS) private metrics: IMetrics,
		@inject(FUEL_DI_TOKENS.LOGGER) private logger: ILogger,
	) {}

	async send<TInput, TOutput>(serviceName: string, action: string, input: TInput): Promise<TOutput> {
		const tracer = this.tracing.createTrace('In Memory RPC Caller Trace');
		const metrics = this.metrics.createMetric('In Memory RPC Caller Metric');
		const latencyHistogram = metrics.createHistogram({
			name: 'In_Memory_Caller_Latency',
			description: 'Metric to describe each In Memory caller latency',
		});

		const serviceAction = this.storage.getAction<TInput, TOutput>(serviceName, action);
		if (!serviceAction) {
			throw new ServiceNotFound();
		}

		return tracer.startNewSpan<TOutput>(`${serviceName}.${action}`, async (span: ITracingSpan) => {
			try {
				const envelope = { payload: input };
				span.setAttribute(SEMATTRS_RPC_REQUEST_BODY, JSON.stringify(envelope));
				span.setAttribute(SEMATTRS_RPC_METHOD, action);
				span.setAttribute(SEMATTRS_RPC_SERVICE, serviceName);
				span.addEvent('Calling In Memory RPC request');
				const startTime = performance.now();

				const { payload } = await serviceAction(this.tracing.hydrateObjectForPropagation<IEnvelope<TInput>>(envelope));

				span.setAttribute(SEMATTRS_RPC_RESPONSE_BODY, JSON.stringify(payload));
				span.addEvent('Finishing In Memory RPC request');
				const duration = performance.now() - startTime;
				latencyHistogram.record({ value: duration, attributes: { service: serviceName, action } });
				this.logger.info(`Finishing In Memory RPC request: ${serviceName}-${action}-${JSON.stringify(envelope)}`);

				return payload;
			} catch (error: any) {
				span.recordException(error);
				this.logger.error(`Finishing In Memory RPC request with Error: ${serviceName}-${action}-${error}`);
				throw new ServiceError(error?.message || '');
			} finally {
				span.end();
			}
		});
	}
}
