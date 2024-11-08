import { FUEL_DI_TOKENS } from '../../dependency-injection';
import type { DependencyContainerManager } from '../../dependency-injection';
import type { ObservabilityStartParams, ILogger, IMetrics, ITracing } from '../../observability';
import {
	ENV,
	LOG_LEVEL,
	ConsoleLogger,
	LoggerOpenTelemetry,
	NoopMetricsAdapter,
	OpenTelemetryMetrics,
	OpenTelemetry,
	NoopTracingAdapter,
	OpenTelemetryTracing,
} from '../../observability';

export class ObservabilityBuilder {
	private instance: OpenTelemetry | null = null;

	constructor(private config: ObservabilityStartParams, private dependencyContainer: DependencyContainerManager) {}

	public static registerLocalDependenciesOnly(dependencyContainer: DependencyContainerManager): void {
		dependencyContainer.registerValueAsFunction<ILogger>(
			FUEL_DI_TOKENS.LOGGER,
			// eslint-disable-next-line new-cap
			() =>
				new ConsoleLogger({
					name: 'default',
					overrideStdout: false,
					lessInfoLogs: false,
					env: process.env.NODE_ENV as ENV,
					defaultLevel: LOG_LEVEL.WARN,
				}),
		);
		dependencyContainer.registerClass<ITracing>(FUEL_DI_TOKENS.TRACING, NoopTracingAdapter);
		dependencyContainer.registerClass<IMetrics>(FUEL_DI_TOKENS.METRICS, NoopMetricsAdapter);
	}

	public start(): void {
		if (this.config.env === ENV.TEST) {
			return;
		}
		this.instance = new OpenTelemetry({
			service: { name: this.config.serviceName },
			sendToConsole: this.config.telemetry.sendToConsole,
			logExporterUrl: this.config.telemetry.logExporterUrl,
			metricsExporterUrl: this.config.telemetry.metricsExporterUrl,
			traceExporterUrl: this.config.telemetry.traceExporterUrl,
		 });
		this.instance.startSdk();

		this.dependencyContainer.registerClass<ITracing>(FUEL_DI_TOKENS.TRACING, OpenTelemetryTracing);
		this.dependencyContainer.registerClass<IMetrics>(FUEL_DI_TOKENS.METRICS, OpenTelemetryMetrics);

		if (this.config.logger.useLocal) {
			this.dependencyContainer.registerValueAsFunction<ILogger>(
				FUEL_DI_TOKENS.LOGGER,
				// eslint-disable-next-line new-cap
				() =>
					new ConsoleLogger({
						name: this.config.serviceName,
						overrideStdout: this.config.logger?.overrideStdout || false,
						lessInfoLogs: this.config.logger?.lessInfoLogs || false,
						env: this.config.env,
						defaultLevel: this.config.logger?.defaultLevel || LOG_LEVEL.INFO,
					}),
			);
			return;
		}

		this.dependencyContainer.registerValueAsFunction<ILogger>(
			FUEL_DI_TOKENS.LOGGER,
			// eslint-disable-next-line new-cap
			() => new LoggerOpenTelemetry({ name: this.config.serviceName }),
		);
	}
}
