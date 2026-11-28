import { createHmac } from 'node:crypto';

import type { IUser } from '@rocket.chat/core-typings';

import type { IceServerConfig } from '../definition/IMediaCallServer';

const DEFAULT_SHARED_SECRET_TTL = 86400;

/** Shared secret credentials follow the TURN REST API (draft-uberti-behave-turn-rest), which mandates HMAC-SHA1; coturn's use-auth-secret rejects any other hash */
export function getIceServer({ urls, auth }: IceServerConfig, uid: IUser['_id']): RTCIceServer {
	switch (auth?.type) {
		case 'static':
			return { urls, username: auth.username, credential: auth.credential };
		case 'shared-secret': {
			const expiresAt = Math.floor(Date.now() / 1000) + (auth.ttl ?? DEFAULT_SHARED_SECRET_TTL);
			const username = `${expiresAt}:${uid}`;

			return { urls, username, credential: createHmac('sha1', auth.secret).update(username).digest('base64') };
		}
		default:
			return { urls };
	}
}
