import crypto from 'node:crypto';

import { Random } from '@rocket.chat/random';

export type StampedLoginToken = {
	token: string;
	when: Date;
};

export type HashedStampedLoginToken = {
	when: Date;
	hashedToken: string;
};

export function hashLoginToken(loginToken: string): string {
	const hash = crypto.createHash('sha256');
	hash.update(loginToken);
	return hash.digest('base64');
}

export function generateStampedLoginToken(): StampedLoginToken {
	return {
		token: Random.secret(),
		when: new Date(),
	};
}

export function hashStampedToken({ token, when }: StampedLoginToken): HashedStampedLoginToken {
	return {
		when,
		hashedToken: hashLoginToken(token),
	};
}
