import type { IRocketChatRecord } from './IRocketChatRecord';
import type { ILoginToken } from './IUser';

export const pushTokenTypes = ['gcm', 'apn'] as const;

export type IPushTokenTypes = (typeof pushTokenTypes)[number];

/**
 * Every token type the send path knows how to deliver to. A document holding anything else
 * (or nothing at all, e.g. a legacy document written by an instance still running the old
 * schema during a rolling upgrade) is not deliverable and must be filtered out before it
 * reaches the send path.
 */
export const pushTokenTypesWithVoip = [...pushTokenTypes, 'voip'] as const;

export type PushTokenType = (typeof pushTokenTypesWithVoip)[number];

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
