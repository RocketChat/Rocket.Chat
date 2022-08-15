import '@rocket.chat/ui-contexts';
import { ILicenseTag } from '../app/license/definitions/ILicenseTag';

declare module '@rocket.chat/ui-contexts' {
	export interface ServerMethods {
		'license:getModules': () => string[];
		'license:getTags': () => ILicenseTag[];
		'auditGetAuditions': (params: { startDate: Date; endDate: Date }) => unknown[];
	}
}
