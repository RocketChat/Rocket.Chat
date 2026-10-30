import type { IRocketChatRecord } from './IRocketChatRecord';
import type { ISessionDevice } from './ISession';
import type { IUser } from './IUser';

export interface IPasskey extends IRocketChatRecord {
	userId: IUser['_id'];
	name: string;
	/** base64url */
	credentialId: string;
	/** COSE-encoded, base64url */
	publicKey: string;
	counter: number;
	transports?: string[];
	/** as the browser reported it: `platform` for an authenticator built into the device, `cross-platform` for a security key or a phone */
	authenticatorAttachment?: 'platform' | 'cross-platform';
	aaguid: string;
	deviceType: 'singleDevice' | 'multiDevice';
	backedUp: boolean;
	createdAt: Date;
	/** the client the passkey was added from */
	createdFrom?: ISessionDevice;
	lastUsedAt?: Date;
	/** the client the passkey last signed in from */
	lastUsedFrom?: ISessionDevice;
}
