import type { IUser } from './IUser';

export interface IPasskeyChallenge {
	/** the challenge itself, base64url */
	_id: string;
	purpose: 'registration' | 'authentication';
	/** the user registering a passkey; authentication challenges are not bound to a user */
	userId?: IUser['_id'];
	createdAt: Date;
	expireAt: Date;
}
