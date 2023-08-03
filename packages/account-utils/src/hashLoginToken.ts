import crypto from 'crypto';

export function hashLoginToken(loginToken: string): string {
	const hash = crypto.createHash('sha256');
	hash.update(loginToken);
	return hash.digest('base64');
}
