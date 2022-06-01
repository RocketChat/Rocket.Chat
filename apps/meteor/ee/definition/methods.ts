import '@rocket.chat/ui-contexts';
import { ILicenseTag } from '../app/license/definitions/ILicenseTag';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	export interface ServerMethods {
		'license:getModules': () => string[];
		'license:getTags': () => ILicenseTag[];
	}
}
