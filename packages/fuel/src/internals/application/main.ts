import { performance } from 'perf_hooks';

import type { LicenseImp } from '@rocket.chat/license';
import { License } from '@rocket.chat/license';

import type { IExternalHttpRouter, ExternalHttpStartParams } from '../../externals';
import { ExpressAPIRouter, TelemetryMiddleware, MeteorCompatibilityMiddleware } from '../../externals';
import type { InterProcessCommunicationStartParams } from '../communication';
import type { DBCredentials, DBUrlCredentials } from '../database';
import { DBBasicReader, DBRepository } from '../database';
import {
	FUEL_DI_TOKENS,
	DependencyContainerManager,
	INJECTION_SCOPE,
	ReadOnlyDependencyContainerManager,
} from '../dependency-injection';
import type { IDependencyContainerReader } from '../dependency-injection';
import { type ObservabilityStartParams, type ILogger, type IMetricHistogram, type IMetric, type IMetrics, ENV } from '../observability';
import { DatabaseBuilder } from './builders/database';
import { EnterpriseBuilder } from './builders/enterprise';
import { ExternalHttpRouterBuilder } from './builders/external-http-router';
import { InternalCommunicationBuilder } from './builders/internal-communication';
import { ObservabilityBuilder } from './builders/observability';
import type { EnterpriseModuleConstructor, Module, ModuleConstructor, Provider } from './definition';
import { DomainEventPublisher } from '../domain';

const dependencyContainerManager = new DependencyContainerManager();

export class RocketChatFuel {
	protected readonly dependencyContainer = dependencyContainerManager;

	private database: DatabaseBuilder | null = null;

	private externalHttpRouterBuilder: ExternalHttpRouterBuilder | null = null;

	private internalCommunicationBuilder: InternalCommunicationBuilder | null = null;

	private observabilityBuilder: ObservabilityBuilder | null = null;

	private mainModule: Module | null = null;

	private mainModuleClass: ModuleConstructor | null = null;

	protected started = false;

	private enterprise: EnterpriseBuilder;

	private applicationMetrics: IMetric | undefined;

	private latencyHistogram: IMetricHistogram | undefined;

	private logger: ILogger | undefined;

	constructor() {
		this.setupDefaultDependencies();

		this.enterprise = new EnterpriseBuilder(this.dependencyContainer);
	}

	public withMainModule(mainModule: ModuleConstructor): RocketChatFuel {
		if (this.mainModuleClass) {
			throw new Error(`Cannot change application's main module`);
		}
		if (this.started) {
			throw new Error(`Cannot change application's main module after the application started`);
		}
		this.mainModuleClass = mainModule;

		return this;
	}

	public withEnterpriseModules(enterpriseModules: EnterpriseModuleConstructor[]): RocketChatFuel {
		if (this.started) {
			throw new Error('Cannot register enterprise modules after the application already started');
		}
		if (this.enterprise.alreadyRegisteredEnterpriseModules()) {
			throw new Error('Already registered Enterprise Modules');
		}

		this.enterprise.addEnterpriseModules(enterpriseModules);

		return this;
	}

	public withExternalHttpRouter(initialParameters: ExternalHttpStartParams): RocketChatFuel {
		if (this.externalHttpRouterBuilder) {
			throw new Error(`Cannot change application's external http router nor register multiple ones`);
		}
		if (this.started) {
			throw new Error(`Cannot change external http router after the application already started`);
		}

		this.externalHttpRouterBuilder = new ExternalHttpRouterBuilder(
			initialParameters,
			this.dependencyContainer.resolveByToken<IExternalHttpRouter>(FUEL_DI_TOKENS.EXTERNAL_HTTP_ROUTER),
		);

		return this;
	}

	public withDatabase(initialParameters: DBCredentials | DBUrlCredentials): RocketChatFuel {
		if (this.database) {
			throw new Error(`Cannot change application's database nor register multiple ones`);
		}
		if (this.started) {
			throw new Error('Cannot change database configuration after the application already started');
		}

		this.database = new DatabaseBuilder(initialParameters);

		return this;
	}

	public withInterProcessCommunication(params: InterProcessCommunicationStartParams): RocketChatFuel {
		if (this.internalCommunicationBuilder) {
			throw new Error(`Cannot change application's internal communication nor register multiple ones`);
		}
		if (this.started) {
			throw new Error('Cannot change internal communication configuration after the application already started');
		}

		this.internalCommunicationBuilder = new InternalCommunicationBuilder(params);

		return this;
	}

	public withObservability(params: ObservabilityStartParams): RocketChatFuel {
		if (params.env === ENV.TEST) {
			return this;
		}
		if (this.observabilityBuilder) {
			throw new Error(`Cannot change application's observability nor register multiple ones`);
		}
		if (this.started) {
			throw new Error('Cannot change observability configuration after the application is already started');
		}
		if (!params.telemetry && !params.logger) {
			throw new Error('If you dont provide a telemetry config, please provide the internal logger configuration');
		}
		this.observabilityBuilder = new ObservabilityBuilder(params, this.dependencyContainer);

		return this;
	}

	public hasStarted(): boolean {
		return this.started === true;
	}

	public async start(): Promise<void> {
		await this.startObservabilityIfNeeded();
		this.logger = this.dependencyContainer.resolveByToken<ILogger>(FUEL_DI_TOKENS.LOGGER);
		if (!this.mainModuleClass) {
			this.logger.error('Main Module is missing');
			throw new Error('Main Module missing');
		}
		if (this.started) {
			this.logger.error('Application already started');
			throw new Error('Application already started');
		}

		const metrics = this.dependencyContainer.resolveByToken<IMetrics>(FUEL_DI_TOKENS.METRICS);
		this.applicationMetrics = metrics.createMetric('Rocket.Chat Application Metrics');
		this.latencyHistogram = this.applicationMetrics.createHistogram({
			name: 'RocketChat_Application_Starting_Latency',
			description: 'Metric to describe Rocket.Chat Application Starting latency',
			unit: 'seconds',
		});
		const startTime = performance.now();
		await this.startDBIfNeeded();
		await this.startInterProcessCommunicationIfNeeded();

		this.ensureNoEEModulesInsideCE(this.mainModuleClass.prototype, this.mainModuleClass);

		this.registerModuleProvidersRecursively((this.mainModuleClass as unknown as typeof Module).modules());
		this.dependencyContainer.registerSingleton('MainModule', this.mainModuleClass);
		try {
			this.mainModule = this.dependencyContainer.resolveByToken<Module>('MainModule');
		} catch (e) {
			this.logger.error(JSON.stringify(e || {}));
			console.error(e);
			process.exit(1);
		}

		await this.registerModulesRecursively((this.mainModuleClass as unknown as typeof Module).modules());
		await this.registerModulesRecursively(await this.enterprise.getEnabledEnterpriseModules());
		await this.mainModule.onStartModule();
		this.started = true;
		this.enterprise.setupEnterpriseListeners();
		this.setupTerminationSignalsListeners();
		this.enterprise.startEnterpriseOperationsWorker({
			onRegister: this.registerEnterpriseDependencies.bind(this),
			onUnregister: this.unregisterEnterpriseDependencies.bind(this),
		});

		if (this.externalHttpRouterBuilder) {
			await this.externalHttpRouterBuilder.start();
		}

		await this.executeHookInAllModules((instance: Module) => instance.onStartupApplication());
		const duration = (performance.now() - startTime) / 1000;
		this.latencyHistogram.record({ value: duration, attributes: { firstBuild: true } });
		this.logger.info(`Application sucessfully started after ${duration} seconds`);
	}

	private async startObservabilityIfNeeded(): Promise<void> {
		if (!this.observabilityBuilder) {
			ObservabilityBuilder.registerLocalDependenciesOnly(this.dependencyContainer);
			return;
		}

		await this.observabilityBuilder.start();
	}


	private async startDBIfNeeded(): Promise<void> {
		if (!this.database) {
			return;
		}
		await this.database.start(this.dependencyContainer);
	}

	private async startInterProcessCommunicationIfNeeded(): Promise<void> {
		if (!this.internalCommunicationBuilder) {
			InternalCommunicationBuilder.registerLocalDependenciesOnly(this.dependencyContainer);
			return;
		}

		await this.internalCommunicationBuilder.start(this.dependencyContainer);
	}

	private setupDefaultDependencies(): void {
		this.dependencyContainer.registerSingleton<IDependencyContainerReader>(
			FUEL_DI_TOKENS.DEPENDENCY_CONTAINER_READER,
			ReadOnlyDependencyContainerManager,
		);

		// TODO: registering this as a singleton for now.
		// Once we move away from Meteor we can create a new instance for every request (can't make it now, otherwise we will couple a bunch of places with Meteor's code (WebApp))
		// When creating a new instance, we can decide if attach the http instance to a single port or attach to different port (as needed)
		this.dependencyContainer.registerSingleton<IExternalHttpRouter>(FUEL_DI_TOKENS.EXTERNAL_HTTP_ROUTER, ExpressAPIRouter);
		this.dependencyContainer.registerSingleton<MeteorCompatibilityMiddleware>(
			'MeteorCompatibilityMiddleware',
			MeteorCompatibilityMiddleware,
		);
		this.dependencyContainer.registerSingleton<TelemetryMiddleware>('TelemetryMiddleware', TelemetryMiddleware);
		this.dependencyContainer.registerSingleton<DomainEventPublisher>(FUEL_DI_TOKENS.DOMAIN_EVENT_PUBLISHER, DomainEventPublisher);

		this.dependencyContainer.registerValue<LicenseImp>(FUEL_DI_TOKENS.LICENSE_MANAGER, License);
	}

	private setupTerminationSignalsListeners(): void {
		process.on('SIGINT', async () => {
			this.logger?.info(`Stopping the application with SIGINT`);
			await this.executeHookInAllModules((instance: Module) => instance.onShutdownApplication('SIGINT'));
			process.exit(0);
		});

		process.on('SIGTERM', async () => {
			this.logger?.info(`Stopping the application SIGTERM SIGINT`);
			await this.executeHookInAllModules((instance: Module) => instance.onShutdownApplication('SIGTERM'));
			process.exit(0);
		});
	}

	private ensureNoEEModulesInsideCE(instance: Module, classModule: ModuleConstructor): void {
		if (
			!this.enterprise.isEnterpriseModule(instance) &&
			(classModule as unknown as typeof Module).modules().some((module) => this.enterprise.isEnterpriseModule(module.prototype))
		) {
			throw new Error('Cannot register EE modules inside of a CE one, prefer "registerEnterpriseModules" instead');
		}
	}

	private ensureNoCEModulesInsideEE(instance: Module, classModule: ModuleConstructor): void {
		if (
			this.enterprise.isEnterpriseModule(instance) &&
			!(classModule as unknown as typeof Module).modules().every((module) => this.enterprise.isEnterpriseModule(module.prototype))
		) {
			throw new Error('Cannot register CE modules inside of an EE one');
		}
	}

	private registerModuleProvidersRecursively(modules: ModuleConstructor[]): void {
		this.walkModuleProvidersRecursivelyExecutingAction(modules, (provider: Provider) => {
			if (this.dependencyContainer.isRegistered(provider.token)) {
				return;
			}
			if (provider.constructor.prototype instanceof DBRepository) {
				this.registerDBDependencyOnContainer(
					provider,
					'Cannot register DB Repositories without a database connection established',
					this.database?.getIDBInteractor(),
				);
				return;
			}
			if (provider.constructor.prototype instanceof DBBasicReader) {
				this.registerDBDependencyOnContainer(
					provider,
					'Cannot register DB Readers without a database connection established',
					this.database?.getIDBReaderInteractor(),
				);
				return;
			}
			if (provider.scope === INJECTION_SCOPE.TRANSIENT) {
				return this.dependencyContainer.registerClass(provider.token, provider.constructor);
			}
			if (provider.scope === INJECTION_SCOPE.VALUE) {
				return this.dependencyContainer.registerValue(provider.token, provider.value);
			}

			this.dependencyContainer.registerSingleton(provider.token, provider.constructor);
		});
	}

	private registerDBDependencyOnContainer<T>(provider: Provider, errorMessage: string, dbDependency: T | undefined): void {
		if (!this.database || !dbDependency) {
			this.logger?.error(errorMessage);
			throw new Error(errorMessage);
		}
		if (provider.scope === INJECTION_SCOPE.VALUE) {
			throw new Error('Cannot register a DB dependency as a value');
		}
		if (!(provider.constructor as any).collectionName()) {
			throw new Error('DB Dependencies (Readers, Basic readers or Repositories), must have a collectionName static function');
		}
		this.dependencyContainer.registerValueAsFunction(
			provider.token,
			() =>
				new provider.constructor((provider.constructor as any).collectionName(), dbDependency, this.dependencyContainer.resolveByToken(FUEL_DI_TOKENS.DEPENDENCY_CONTAINER_READER)),
			provider.scope,
		);
	}

	private unregisterModuleProvidersRecursively(modules: ModuleConstructor[]): void {
		this.walkModuleProvidersRecursivelyExecutingAction(modules, (provider: Provider) =>
			this.dependencyContainer.unregister(provider.token),
		);
	}

	private walkModuleProvidersRecursivelyExecutingAction(modules: ModuleConstructor[], action: (provider: Provider) => void): void {
		for (const module of modules) {
			const classModule = module as unknown as typeof Module;

			classModule.providers().forEach((provider) => {
				if (!provider.token) {
					this.logger?.error('A Provider must have a token');
					throw new Error('A Provider must have a token');
				}
				if (!provider.constructor) {
					this.logger?.error('A Provider must have a constructor');
					throw new Error(`Provider must have a constructor`);
				}
				action(provider);
			});

			if (classModule.modules().length > 0) {
				this.walkModuleProvidersRecursivelyExecutingAction(classModule.modules(), action);
			}
		}
	}

	private async registerModulesRecursively(modules: ModuleConstructor[]): Promise<void> {
		await Promise.all(
			modules.map(async (module) => {
				if (this.dependencyContainer.isRegistered(module.name)) {
					return;
				}
				this.dependencyContainer.registerSingleton(module.name, module);
				const instance = this.dependencyContainer.resolveByToken<Module>(module.name);

				const classModules = (module as unknown as typeof Module).modules();

				if (classModules.length > 0) {
					this.ensureNoCEModulesInsideEE(instance, module);
					this.ensureNoEEModulesInsideCE(instance, module);
					await this.registerModulesRecursively(classModules);
				}
				return instance.onStartModule();
			}),
		);
	}

	private async unregisterModulesRecursively(modules: ModuleConstructor[]): Promise<void> {
		await Promise.all(
			modules.map(async (module) => {
				if (this.dependencyContainer.isRegistered(module.name)) {
					const instance = this.dependencyContainer.resolveByToken<Module>(module.name);
					await instance.onStopModule();
				}

				this.dependencyContainer.unregister(module.name);

				const classModules = (module as unknown as typeof Module).modules();
				if (classModules.length > 0) {
					await this.unregisterModulesRecursively(classModules);
				}
			}),
		);
	}

	private async executeHookInAllModules(callback: (instance: Module) => void): Promise<void> {
		this.logger?.info(`Executing action in all modules ${callback.toString()}`);
		await Promise.all([
			...(this.mainModuleClass as unknown as typeof Module)
				.modules()
				.map((module) => callback(this.dependencyContainer.resolveByToken<Module>(module.name))),
			...(await this.enterprise.getEnabledEnterpriseModules()).map((module) => callback(this.dependencyContainer.resolveByToken<Module>(module.name))),
		]);
		if (this.mainModule) {
			callback(this.mainModule);
		}
	}

	private async unregisterEnterpriseDependencies(): Promise<void> {
		this.logger?.info('Running "unregister" due to EE license changes');
		const startTime = performance.now();

		const toDisable = await this.enterprise.getDiffOfEnterpriseModulesAfterUnregister();
		this.unregisterModuleProvidersRecursively(toDisable);
		await this.unregisterModulesRecursively(toDisable);
		if (this.externalHttpRouterBuilder) {
			await this.externalHttpRouterBuilder.refreshAPIInstance();
		}
		this.recordRebuildMetric({ startTime, registeringEE: false });
	}

	private recordRebuildMetric({ startTime, registeringEE }: { startTime: number; registeringEE: boolean }): void {
		if (!this.latencyHistogram) {
			return;
		}
		const duration = (performance.now() - startTime) / 1000;
		this.latencyHistogram.record({
			value: duration,
			attributes: { firstBuild: false, rebuilding: true, registeringEE },
		});
	}

	private async registerEnterpriseDependencies(): Promise<void> {
		this.logger?.info('Running "register" due to EE license changes');
		const startTime = performance.now();

		const onlyEnabledEnterpriseModules = await this.enterprise.getEnabledEnterpriseModules();
		this.registerModuleProvidersRecursively(onlyEnabledEnterpriseModules);
		await this.registerModulesRecursively(onlyEnabledEnterpriseModules);
		if (this.externalHttpRouterBuilder) {
			await this.externalHttpRouterBuilder.refreshAPIInstance();
		}

		this.recordRebuildMetric({ startTime, registeringEE: true });
	}
}
