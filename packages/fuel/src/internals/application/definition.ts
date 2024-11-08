import type { DBRepository } from '../database';
import type { INJECTION_SCOPE } from '../dependency-injection';

export type Constructor = new (...args: any[]) => any;
export type ModuleConstructor = new (...args: any[]) => Module;
export type RepositoryConstructor = new (...args: any[]) => DBRepository<any>;
export type Provider =
	| { token: string; constructor: RepositoryConstructor | Constructor; scope: INJECTION_SCOPE.SINGLETON | INJECTION_SCOPE.TRANSIENT }
	| { token: string; value: any; scope: INJECTION_SCOPE.VALUE; };
export type DynamicConfigurationParams = { token: string; value: any; scope: INJECTION_SCOPE.VALUE; }[];

export abstract class Module {
	public async onStartModule(): Promise<void> {
		// override
	}

	abstract onStopModule(): Promise<void>;

	public async onShutdownApplication(_: string): Promise<void> {
		// override
	}

	public async onStartupApplication(): Promise<void> {
		// override
	}

	public static configure(_configParams: DynamicConfigurationParams): void {
		// override
	}

	public static modules(): ModuleConstructor[] {
		return [];
	}

	public static providers(): Provider[] {
		return [];
	}
}

export abstract class EnterpriseModule extends Module {
	public static async enterpriseRequirements(): Promise<boolean> {
		return false;
	}
}

export type EnterpriseModuleConstructor = new (...args: any[]) => EnterpriseModule;
