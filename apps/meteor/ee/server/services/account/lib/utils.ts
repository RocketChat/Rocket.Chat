import crypto from 'crypto';

import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface IStampedToken {
	token: string;
	when: Date;
	[key: string]: any;
}

export interface IHashedStampedToken {
	when: Date;
	hashedToken: string;
}

type Password =
	| string
	| {
			digest: string;
	  };

export const getPassword = (password: Password): string => {
	if (typeof password === 'string') {
		return crypto.createHash('sha256').update(password).digest('hex'); // lgtm [js/insufficient-password-hash]
	}
	if (typeof password.digest === 'undefined') {
		throw new Error('invalid password');
	}
	return password.digest;
};

// https://github.com/meteor/meteor/blob/c5b51b0fc2a8cef498b9390ebcb4925e02de83e8/packages/accounts-base/accounts_server.js#L934
export const _generateStampedLoginToken = (): IStampedToken => ({
	token: uuidv4(),
	when: new Date(),
});

// https://github.com/meteor/meteor/blob/c5b51b0fc2a8cef498b9390ebcb4925e02de83e8/packages/accounts-base/accounts_server.js#L780
export const _hashLoginToken = (loginToken: string): string => {
	const hash = crypto.createHash('sha256');
	hash.update(loginToken);
	return hash.digest('base64');
};

// https://github.com/meteor/meteor/blob/c5b51b0fc2a8cef498b9390ebcb4925e02de83e8/packages/accounts-base/accounts_server.js#L787
export const _hashStampedToken = (stampedToken: IStampedToken): IHashedStampedToken => {
	const hashedStampedToken = Object.keys(stampedToken).reduce(
		(prev, key) => (key === 'token' ? prev : { ...prev, [key]: stampedToken[key] }),
		{},
	);

	return {
		...hashedStampedToken,
		hashedToken: _hashLoginToken(stampedToken.token),
	} as IHashedStampedToken;
};

export const validatePassword = (password: string, bcryptPassword: string): Promise<boolean> =>
	bcrypt.compare(getPassword(password), bcryptPassword);

export const _tokenExpiration = (when: string | Date, expirationInDays: number): Date =>
	new Date(new Date(when).getTime() + expirationInDays * 60 * 60 * 24 * 1000);
