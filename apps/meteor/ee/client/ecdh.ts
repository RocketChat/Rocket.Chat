import { Meteor } from 'meteor/meteor';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import type { ClientSession } from '../app/ecdh/client/ClientSession';

let resolveSession: (session: ClientSession | undefined) => void;

const sessionPromise = new Promise<ClientSession | undefined>((resolve) => {
	resolveSession = (session) => {
		Meteor.connection._stream.allowConnection();
		resolve(session);
	};
});

function init(session: ClientSession): void {
	const _didMessage = Meteor.connection._stream.socket._didMessage.bind(Meteor.connection._stream.socket);
	const send = Meteor.connection._stream.socket.send.bind(Meteor.connection._stream.socket);

	Meteor.connection._stream.socket._didMessage = async (data): Promise<void> => {
		const decryptedData = await session.decrypt(data);
		decryptedData.split('\n').forEach((d) => _didMessage(d));
	};

	Meteor.connection._stream.socket.send = async (data): Promise<void> => {
		send(await session.encrypt(data));
	};
}

async function initEncryptedSession(): Promise<void> {
	if (!window.ECDH_Enabled) {
		resolveSession(undefined);
		return;
	}

	const { ClientSession } = await import('../app/ecdh/client/ClientSession');
	const session = new ClientSession();
	const clientPublicKey = await session.init();

	try {
		const response = await fetch('/api/ecdh_proxy/initEncryptedSession', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ clientPublicKey }),
		});

		if (response.status !== 200) {
			throw new Error(response.statusText);
		}

		const data = await response.json();

		if (data.success === false) {
			throw new Error('Failed to initialize encrypted session');
		}

		await session.setServerKey(data.publicKeyString);
		resolveSession(session);
		init(session);
	} catch (error) {
		console.error(error);
		resolveSession(undefined);
	}
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
