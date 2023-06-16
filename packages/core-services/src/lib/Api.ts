import type { IApiService } from '../types/IApiService';
import type { IBroker, IBrokerNode } from '../types/IBroker';
import type { IServiceClass } from '../types/ServiceClass';
import type { EventSignatures } from '../Events';

enum ServiceLayerType {
	ENTERPRISE = 'ee',
	DEFAULT = 'ce',
}

export interface IEnterpriseAdapter {
	hasModuleEnabled(moduleName: string): boolean;
	onModuleEnabled(moduleName: string, callback: () => void): void;
}

export class Api implements IApiService {
	private services: Map<string, { instance: IServiceClass; dependencies?: string[] }> = new Map<
		string,
		{ instance: IServiceClass; dependencies?: string[] }
	>();

	private enterpriseAdapter?: IEnterpriseAdapter;

	private enterpriseServices: Map<string, Map<string, { instance: IServiceClass; dependencies?: string[] }>> = new Map<
		string,
		Map<ServiceLayerType, { instance: IServiceClass; dependencies?: string[] }>
	>();

	private broker?: IBroker;

	// set a broker for the API and registers all services in the broker
	setBroker(broker: IBroker): void {
		if (!this.enterpriseAdapter) {
			throw new Error('You must set an enterprise adapter before setting a broker.');
		}
		this.broker = broker;

		this.services.forEach((service) => this.broker?.createService(service.instance, service.dependencies));
		this.enterpriseServices.forEach((enterpriseService, moduleName) => {
			const enterpriseInstance = enterpriseService.get(ServiceLayerType.ENTERPRISE);
			const instance = enterpriseService.get(ServiceLayerType.DEFAULT);
			if (!enterpriseInstance || !instance) {
				return;
			}
			this.broker?.createService(
				this.enterpriseAdapter?.hasModuleEnabled(moduleName) ? enterpriseInstance.instance : instance.instance,
				enterpriseInstance.dependencies,
			);
		});
	}

	setEnterpriseAdapter(enterpriseAdapter: IEnterpriseAdapter): void {
		this.enterpriseAdapter = enterpriseAdapter;
	}

	async destroyService(instance: IServiceClass): Promise<void> {
		if (!this.services.has(instance.getName())) {
			return;
		}

		if (this.broker) {
			await this.broker.destroyService(instance);
		}

		this.services.delete(instance.getName());
	}

	registerService(instance: IServiceClass, serviceDependencies?: string[]): void {
		this.services.set(instance.getName(), { instance, dependencies: serviceDependencies });

		instance.setApi(this);

		if (this.broker) {
			this.broker.createService(instance, serviceDependencies);
		}
	}

	registerEnterpriseService(
		instance: IServiceClass,
		enterpriseInstance: IServiceClass,
		enterpriseModuleName: string,
		serviceDependencies?: string[],
	): void {
		if (!enterpriseModuleName) {
			throw new Error('You must provide a module name to register the enterprise service.');
		}
		if (!this.enterpriseAdapter) {
			throw new Error('You must set an enterprise adapter before registering an enterprise service.');
		}
		this.enterpriseServices.set(
			enterpriseModuleName,
			new Map<ServiceLayerType, { instance: IServiceClass; dependencies?: string[] }>([
				[ServiceLayerType.DEFAULT, { instance, dependencies: serviceDependencies }],
				[ServiceLayerType.ENTERPRISE, { instance: enterpriseInstance, dependencies: serviceDependencies }],
			]),
		);
		instance.setApi(this);
		enterpriseInstance.setApi(this);

		if (this.broker) {
			this.broker.createService(
				this.enterpriseAdapter.hasModuleEnabled(enterpriseModuleName) ? enterpriseInstance : instance,
				serviceDependencies,
			);
		}
		this.enterpriseAdapter.onModuleEnabled(enterpriseModuleName, async () => {
			await this.broker?.destroyService(instance);
			this.broker?.createService(enterpriseInstance, serviceDependencies);
		});
	}

	async call(method: string, data?: unknown): Promise<any> {
		return this.broker?.call(method, data);
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		return this.broker?.waitAndCall(method, data);
	}

	async broadcast<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker?.broadcast(event, ...args);
	}

	async broadcastToServices<T extends keyof EventSignatures>(
		services: string[],
		event: T,
		...args: Parameters<EventSignatures[T]>
	): Promise<void> {
		return this.broker?.broadcastToServices(services, event, ...args);
	}

	async broadcastLocal<T extends keyof EventSignatures>(event: T, ...args: Parameters<EventSignatures[T]>): Promise<void> {
		return this.broker?.broadcastLocal(event, ...args);
	}

	nodeList(): Promise<IBrokerNode[]> {
		if (!this.broker) {
			throw new Error('No broker set to start.');
		}
		return this.broker.nodeList();
	}

	async start(): Promise<void> {
		if (!this.broker) {
			throw new Error('No broker set to start.');
		}
		await this.broker.start();
	}
}
