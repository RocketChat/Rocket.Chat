import type { IRocketChatRecord } from './IRocketChatRecord';

export type IPushTokenTypes = 'gcm' | 'apn';

export interface IPushToken extends IRocketChatRecord {
	token: Record<IPushTokenTypes, string>;
	appName: string;
	userId: string;
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}
