/**
 * Delegate interface for SIP extension information.
 * @remarks
 * This interface is implemented by a class which is
 * interested SIP registration events.
 */

import type { IExtensionDetails } from '../IVoipExtension';
import type { ICallServerConfigData } from '../IVoipServerConfig';

export interface IRegistrationInfo {
	host: string;
	callServerConfig: ICallServerConfigData;
	extensionDetails: IExtensionDetails;
}
