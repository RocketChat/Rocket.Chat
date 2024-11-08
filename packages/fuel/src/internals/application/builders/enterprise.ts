import type { LicenseImp } from '@rocket.chat/license';

import { FUEL_DI_TOKENS } from '../../dependency-injection';
import type { DependencyContainerManager } from '../../dependency-injection/container';
import type { EnterpriseModuleConstructor, Module } from '../definition';
import { EnterpriseModule } from '../definition';

const ENTERPRISE_WORKER_INTERVAL_IN_MS = 5000;

enum EE_WORKER_STATUS {
	EXECUTING = 'EXECUTING',
	STOPPED = 'STOPPED',
}

enum EE_WORKER_OPERATIONS {
	REGISTER = 'REGISTER',
	UNREGISTER = 'UNREGISTER',
}

export class EnterpriseBuilder {
	private enterpriseModules: EnterpriseModuleConstructor[] = [];

	private dependencyContainerEnterpriseOperations: {
		status: EE_WORKER_STATUS;
		operations: { operation: EE_WORKER_OPERATIONS }[];
	} = {
		status: EE_WORKER_STATUS.STOPPED,
		operations: [],
	};

	constructor(private dependencyContainer: DependencyContainerManager) {}

	public addEnterpriseModules(enterpriseModules: EnterpriseModuleConstructor[]): void {
		if (!enterpriseModules.every((module) => module.prototype instanceof EnterpriseModule)) {
			throw new Error('"registerEnterpriseModules" method can only register Enterprise Modules');
		}
		this.enterpriseModules = this.enterpriseModules.concat(enterpriseModules);
	}

	public alreadyRegisteredEnterpriseModules(): boolean {
		return this.enterpriseModules.length > 0;
	}

	public isEnterpriseModule(instance: Module): boolean {
		return instance instanceof EnterpriseModule;
	}

	public getEnterpriseModules(): EnterpriseModuleConstructor[] {
		return this.enterpriseModules;
	}

	public async getEnabledEnterpriseModules(): Promise<EnterpriseModuleConstructor[]> {
		const licenseManager = this.dependencyContainer.resolveByToken<LicenseImp>(FUEL_DI_TOKENS.LICENSE_MANAGER);
		if (!licenseManager.hasValidLicense()) {
			return [];
		}
		const moduleEnabledFlags = await Promise.all(
			this.enterpriseModules.map((module) => (module as unknown as typeof EnterpriseModule).enterpriseRequirements()),
		);

		return this.enterpriseModules.filter((_, index) => moduleEnabledFlags[index]);
	}

	public async getDiffOfEnterpriseModulesAfterUnregister(): Promise<EnterpriseModuleConstructor[]> {
		const onlyEnabledEnterpriseModules = await this.getEnabledEnterpriseModules();

		return this.enterpriseModules.filter((module) => !onlyEnabledEnterpriseModules.includes(module));
	}

	public setupEnterpriseListeners(): void {
		const licenseManager = this.dependencyContainer.resolveByToken<LicenseImp>(FUEL_DI_TOKENS.LICENSE_MANAGER);

		licenseManager.onInstall(() =>
			this.dependencyContainerEnterpriseOperations.operations.push({ operation: EE_WORKER_OPERATIONS.REGISTER }),
		);
		licenseManager.onValidateLicense(() =>
			this.dependencyContainerEnterpriseOperations.operations.push({ operation: EE_WORKER_OPERATIONS.REGISTER }),
		);

		licenseManager.onInvalidateLicense(() =>
			this.dependencyContainerEnterpriseOperations.operations.push({ operation: EE_WORKER_OPERATIONS.UNREGISTER }),
		);
		licenseManager.onRemoveLicense(() =>
			this.dependencyContainerEnterpriseOperations.operations.push({ operation: EE_WORKER_OPERATIONS.UNREGISTER }),
		);
		licenseManager.onInvalidate(() =>
			this.dependencyContainerEnterpriseOperations.operations.push({ operation: EE_WORKER_OPERATIONS.UNREGISTER }),
		);
	}

	public startEnterpriseOperationsWorker({
		onRegister,
		onUnregister,
	}: {
		onRegister: () => Promise<void>;
		onUnregister: () => Promise<void>;
	}): void {
		setInterval(async () => {
			if (
				this.dependencyContainerEnterpriseOperations.operations.length === 0 ||
				this.dependencyContainerEnterpriseOperations.status === EE_WORKER_STATUS.EXECUTING
			) {
				return;
			}
			const operation = this.dependencyContainerEnterpriseOperations.operations.shift()?.operation;
			if (operation === EE_WORKER_OPERATIONS.REGISTER) {
				this.dependencyContainerEnterpriseOperations.status = EE_WORKER_STATUS.EXECUTING;
				await onRegister();
				this.dependencyContainerEnterpriseOperations.status = EE_WORKER_STATUS.STOPPED;
			}
			if (operation === EE_WORKER_OPERATIONS.UNREGISTER) {
				this.dependencyContainerEnterpriseOperations.status = EE_WORKER_STATUS.EXECUTING;
				await onUnregister();
				this.dependencyContainerEnterpriseOperations.status = EE_WORKER_STATUS.STOPPED;
			}
		}, ENTERPRISE_WORKER_INTERVAL_IN_MS);
	}
}
