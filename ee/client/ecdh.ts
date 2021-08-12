import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../app/utils/client';
import type { ClientSession } from '../app/ecdh/client/ClientSession';

let resolveSession: (value: ClientSession | void) => void;
const sessionPromise = new Promise<ClientSession | void>((resolve) => {
	resolveSession = resolve;
});

function init(session: ClientSession): void {
	Meteor.connection._stream.allowConnection();

	const _didMessage = Meteor.connection._stream.socket._didMessage.bind(
		Meteor.connection._stream.socket,
	);
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
		Meteor.connection._stream.allowConnection();
		return resolveSession();
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
			resolveSession();
			return Meteor.connection._stream.allowConnection();
		}

		const data = await response.json();

		if (data.success === false) {
			resolveSession();
			return Meteor.connection._stream.allowConnection();
		}

		await session.setServerKey(data.publicKeyString);
		resolveSession(session);
		init(session);
	} catch (e) {
		console.log(e);
		resolveSession();
		Meteor.connection._stream.allowConnection();
	}
}

initEncryptedSession();

const _jqueryCall = APIClient._jqueryCall.bind(APIClient);

APIClient._jqueryCall = async (method, endpoint, params, body, headers = {}): Promise<any> => {
	const session = await sessionPromise;

	if (!session) {
		return _jqueryCall(method, endpoint, params, body, headers);
	}

	const result = await _jqueryCall(method, endpoint, params, body, headers, 'text');
	const decrypted = await session.decrypt(result);
	const parsed = JSON.parse(decrypted);
	return parsed;
};
