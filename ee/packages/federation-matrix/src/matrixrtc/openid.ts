import { randomBytes } from 'node:crypto';

/** What Synapse issues, so services that cache by it see the lifetime they expect. */
const OPENID_TOKEN_TTL_SECONDS = 3600;

/** The Matrix client-server answer to `openid/request_token`, which is what token services expect to be handed. */
export type MatrixOpenIdToken = {
	access_token: string;
	token_type: 'Bearer';
	matrix_server_name: string;
	expires_in: number;
};

// TODO(matrixrtc): keep issued OpenID tokens where every instance can read them
// They live in this process, so only the instance that issued a token answers userinfo for it.
const issued = new Map<string, { sub: string; expiresAt: number }>();

const forgetExpired = (now: number): void => {
	for (const [accessToken, { expiresAt }] of issued) {
		if (expiresAt <= now) {
			issued.delete(accessToken);
		}
	}
};

/**
 * An OpenID token with which a service of another homeserver can learn, from this server's userinfo endpoint, that
 * its bearer is `matrixUserId`. Only for this server's own users: the token names this server as the one vouching.
 */
export function issueOpenIdToken(matrixUserId: string, serverName: string, now = Date.now()): MatrixOpenIdToken {
	forgetExpired(now);

	const accessToken = randomBytes(32).toString('base64url');
	issued.set(accessToken, { sub: matrixUserId, expiresAt: now + OPENID_TOKEN_TTL_SECONDS * 1000 });

	return { access_token: accessToken, token_type: 'Bearer', matrix_server_name: serverName, expires_in: OPENID_TOKEN_TTL_SECONDS };
}

/** The Matrix user an OpenID token issued here vouches for, while it is valid. */
export function getOpenIdTokenSubject(accessToken: string, now = Date.now()): string | undefined {
	const token = issued.get(accessToken);
	if (!token) {
		return undefined;
	}

	if (token.expiresAt <= now) {
		issued.delete(accessToken);
		return undefined;
	}

	return token.sub;
}
