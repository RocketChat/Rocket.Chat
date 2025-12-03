import { Meteor } from 'meteor/meteor';

import type { ClientSession } from '../app/ecdh/client/ClientSession';
import { sdk } from '../app/utils/client/lib/SDKClient';

let resolveSession: (value: ClientSession | void) => void;
const sessionPromise = new Promise<ClientSession | void>((resolve) => {
	resolveSession = resolve;
});

async function initEncryptedSession(): Promise<void> {
	Meteor.connection._stream.allowConnection();
	return resolveSession();
}

initEncryptedSession();
sdk.rest.use(async (request, next) => {
	const session = await sessionPromise;

	if (!session) {
		return next(...request);
	}
	const result = await (await next(...request)).text();
	const decrypted = await session.decrypt(result);
	const parsed = JSON.parse(decrypted);
	return parsed;
});
