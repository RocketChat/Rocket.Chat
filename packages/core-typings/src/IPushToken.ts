import type { IRocketChatRecord } from './IRocketChatRecord';
import type { ILoginToken } from './IUser';

export const pushTokenTypes = ['gcm', 'apn'] as const;

export type IPushTokenTypes = (typeof pushTokenTypes)[number];

export type PushTokenType = IPushTokenTypes | 'voip';

export type PushTokenTarget = { apn: string } | { gcm: string };

export type RegisterPushTokenInput = {
	_id?: string;
	token: PushTokenTarget;
	authToken: string;
	appName: string;
	userId: string;
	metadata?: Record<string, unknown>;
	voipToken?: string;
};

export interface IPushToken extends IRocketChatRecord {
	tokenType: PushTokenType;
	tokenValue: string;
	appName: string;
	userId: string;
	enabled: boolean;
	authToken: ILoginToken['hashedToken'];
	metadata?: Record<string, unknown>;
	createdAt: Date;
}
