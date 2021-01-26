import { IServiceClass } from './ServiceClass';

export type EnterpriseStatistics = {
	modules: string[];
	tags: string[];
}

export interface IEnterprise extends IServiceClass {
	validateUserRoles(userId: string, userData: {_id: string; roles: string[]}): void;

	getStatistics(): EnterpriseStatistics;
}
