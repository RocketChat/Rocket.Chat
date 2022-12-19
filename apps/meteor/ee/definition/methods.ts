import '@rocket.chat/ui-contexts';
import type { ILicenseTag } from '../app/license/definitions/ILicenseTag';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface ServerMethods {
		'license:getModules': () => string[];
		'license:getTags': () => ILicenseTag[];
		'auditGetAuditions': (params: { startDate: Date; endDate: Date }) => unknown[];
	}
}
