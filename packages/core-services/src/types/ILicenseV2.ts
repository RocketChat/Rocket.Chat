import type { IServiceClass } from './ServiceClass';

export interface ILicenseV2 extends IServiceClass {
	hasLicense(feature: string): boolean;

	isEnterprise(): boolean;

	getModules(): string[];

	getGuestPermissions(): string[];
}
