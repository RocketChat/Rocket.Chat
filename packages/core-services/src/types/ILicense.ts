import type { IServiceClass } from './ServiceClass.js';

export interface ILicense extends IServiceClass {
	hasModule(feature: string): boolean;

	hasValidLicense(): boolean;

	getModules(): string[];

	getGuestPermissions(): string[];
}
