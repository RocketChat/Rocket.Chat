import crypto from 'node:crypto';

import { Random } from '@rocket.chat/random';
import bcrypt from 'bcrypt';

export type StampedLoginToken = {
	token: string;
	when: Date;
};

export type HashedStampedLoginToken = {
	when: Date;
	hashedToken: string;
};

export type Password = string | { digest: string; algorithm: 'sha-256' };

export const BCRYPT_ROUNDS = 10;

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

// The web client sends the SHA-256 digest of the password, so plaintext passwords are digested the same way before bcrypt.
function getPasswordDigest(password: Password): string {
	if (typeof password === 'string') {
		return crypto.createHash('sha256').update(password).digest('hex');
	}
	return password.digest;
}

export function hashPassword(password: Password): Promise<string> {
	return bcrypt.hash(getPasswordDigest(password), BCRYPT_ROUNDS);
}

export function verifyPassword(password: Password, passwordHash: string): Promise<boolean> {
	return bcrypt.compare(getPasswordDigest(password), passwordHash);
}
