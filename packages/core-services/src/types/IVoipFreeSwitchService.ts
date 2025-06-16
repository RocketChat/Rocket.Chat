import type { FreeSwitchExtension } from '@rocket.chat/core-typings';

export interface IVoipFreeSwitchService {
	getExtensionList(): Promise<FreeSwitchExtension[]>;
	getExtensionDetails(requestParams: { extension: string; group?: string }): Promise<FreeSwitchExtension>;
	getUserPassword(user: string): Promise<string>;
	getDomain(): Promise<string>;
}
