import { createHmac } from 'node:crypto';

import type { IUser } from '@rocket.chat/core-typings';

import type { TurnSharedSecretSettings } from '../definition/IMediaCallServer';

/** Issues time-limited TURN credentials in the TURN REST API format (draft-uberti-behave-turn-rest), as validated by coturn's use-auth-secret */
export function getTurnIceServer({ uris, secret, credentialTtl }: TurnSharedSecretSettings, uid: IUser['_id']): RTCIceServer {
	const expiresAt = Math.floor(Date.now() / 1000) + credentialTtl;
	const username = `${expiresAt}:${uid}`;

	return {
		urls: uris,
		username,
		credential: createHmac('sha1', secret).update(username).digest('base64'),
	};
}
