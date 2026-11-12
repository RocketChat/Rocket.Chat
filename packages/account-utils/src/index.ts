import crypto from 'node:crypto';

import { Random } from '@rocket.chat/random';
import { SHA256 } from '@rocket.chat/sha256';
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

// Must produce the digest the web client sends; node:crypto differs for characters outside the BMP
function getPasswordDigest(password: Password): string {
	if (typeof password === 'string') {
		return SHA256(password);
	}
	return password.digest.toLowerCase();
}

export function hashPassword(password: Password): Promise<string> {
	return bcrypt.hash(getPasswordDigest(password), BCRYPT_ROUNDS);
}

export function verifyPassword(password: Password, passwordHash: string): Promise<boolean> {
	return bcrypt.compare(getPasswordDigest(password), passwordHash);
}
