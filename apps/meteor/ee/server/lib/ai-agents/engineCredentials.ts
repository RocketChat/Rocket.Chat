import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import type { IAiEngine, IAiEngineCredential } from '@rocket.chat/core-typings';
import { AiEngines } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

const DAY_MS = 24 * 60 * 60 * 1000;
const CREDENTIAL_ID_LENGTH = 17;
const SECRET_BYTES = 32;

export const MAX_ACTIVE_ENGINE_CREDENTIALS = 2;

// `<credential id>.<secret>`: the id is Random.id's alphabet and length, the secret 32 bytes in unpadded base64url
const ENGINE_BEARER = /^Bearer ([23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17})\.([A-Za-z0-9_-]{43})$/;
const MAX_AUTHORIZATION_LENGTH = 'Bearer '.length + CREDENTIAL_ID_LENGTH + 1 + 43;

const hashSecret = (secret: string): Buffer => createHash('sha256').update(secret, 'utf8').digest();

/** A new engine credential: the stored half holds only a verifier, and `token` is shown to the operator once */
export const createEngineCredential = (now: Date, validDays: number): { credential: IAiEngineCredential; token: string } => {
	const id = Random.id(CREDENTIAL_ID_LENGTH);
	const secret = randomBytes(SECRET_BYTES).toString('base64url');

	return {
		credential: {
			id,
			verifier: hashSecret(secret).toString('hex'),
			createdAt: now,
			expiresAt: new Date(now.getTime() + validDays * DAY_MS),
		},
		token: `${id}.${secret}`,
	};
};

const matchesVerifier = (secret: string, verifier: string): boolean => {
	const expected = Buffer.from(verifier, 'hex');
	const actual = hashSecret(secret);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
};

/**
 * The engine a request is from, when it carries a current credential of that engine and nothing else that
 * authenticates; undefined for any other request. A Rocket.Chat login or personal access token is never accepted.
 */
export const authenticateEngineRequest = async (
	headers: Pick<Headers, 'get'>,
	now = new Date(),
): Promise<{ engineId: IAiEngine['_id']; credentialId: IAiEngineCredential['id'] } | undefined> => {
	if (headers.get('x-user-id') !== null || headers.get('x-auth-token') !== null) {
		return undefined;
	}

	const authorization = headers.get('authorization');
	if (!authorization || authorization.length > MAX_AUTHORIZATION_LENGTH) {
		return undefined;
	}

	const match = ENGINE_BEARER.exec(authorization);
	if (!match) {
		return undefined;
	}
	const [, credentialId, secret] = match;

	const engine = await AiEngines.findOneByCredentialId(credentialId, { projection: { credentials: 1 } });
	const credential = engine?.credentials.find(({ id }) => id === credentialId);
	if (!engine || !credential || !matchesVerifier(secret, credential.verifier)) {
		return undefined;
	}

	if (credential.revokedAt || credential.expiresAt.getTime() <= now.getTime()) {
		return undefined;
	}

	return { engineId: engine._id, credentialId };
};
