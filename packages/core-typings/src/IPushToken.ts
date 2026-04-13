import type { IRocketChatRecord } from './IRocketChatRecord';
import type { ILoginToken } from './IUser';

export type IPushTokenTypes = 'gcm' | 'apn';

export interface IPushToken extends IRocketChatRecord {
	token: Partial<Record<IPushTokenTypes, string>>;
	appName: string;
	userId: string;
	enabled: boolean;
	authToken: ILoginToken['hashedToken'];
	metadata?: Record<string, unknown>;
	createdAt: Date;
	voipToken?: string;
}
