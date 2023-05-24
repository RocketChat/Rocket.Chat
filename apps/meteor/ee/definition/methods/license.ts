import '@rocket.chat/ui-contexts';
import type { ILicenseTag } from '../../app/license/definition/ILicenseTag';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export interface ServerMethods {
		'license:getModules': () => string[];
		'license:getTags': () => ILicenseTag[];
	}
}
