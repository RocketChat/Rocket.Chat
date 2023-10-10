import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IInstalledLicense extends IRocketChatRecord {
	installedOn: Date;
	encryptedValue: string;
	version: string;
	active: boolean;
}
