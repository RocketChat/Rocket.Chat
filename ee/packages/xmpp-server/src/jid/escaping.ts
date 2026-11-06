import { escapeLocal, unescapeLocal } from '@xmpp/jid';

import { InvalidJidError } from '../errors';

// RFC 6122 limits each JID part to 1023 bytes
const MAX_LOCALPART_BYTES = 1023;

/** XEP-0106 JID escaping — maps arbitrary usernames (spaces, `@`, `/`, ...) into a valid JID localpart. */
export function escapeLocalpart(localpart: string): string {
	const escaped = escapeLocal(localpart);
	if (!escaped || Buffer.byteLength(escaped) > MAX_LOCALPART_BYTES) {
		throw new InvalidJidError(localpart);
	}

	return escaped;
}

export function unescapeLocalpart(localpart: string): string {
	return unescapeLocal(localpart);
}
