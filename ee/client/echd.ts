import { ClientSession } from 'ecdh-proxy';
import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../app/utils/client';

let resolveSession: (value: ClientSession | void) => void;
const sessionPromise = new Promise<ClientSession | void>((resolve) => { resolveSession = resolve; });

function init(session: ClientSession): void {
	Meteor.connection._stream._launchConnectionAsync();

	// Meteor.connection._stream.socket._options.debug = true;

	const _didMessage = Meteor.connection._stream.socket._didMessage.bind(Meteor.connection._stream.socket);
	const send = Meteor.connection._stream.socket.send.bind(Meteor.connection._stream.socket);

	Meteor.connection._stream.socket._didMessage = async (data: string): Promise<void> => {
		// console.log('received', { data });
		const decryptedData = await session.decrypt(data);
		console.log('received', { decryptedData });
		_didMessage(decryptedData);
	};

	Meteor.connection._stream.socket.send = async (data: string): Promise<void> => {
		// console.log('sending', data);
		send(await session.encrypt(data));
	};
}

async function initEncryptedSession(): Promise<void> {
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
			return Meteor.connection._stream._launchConnectionAsync();
		}

		const serverKey = await response.text();
		console.log({ serverKey });

		await session.setServerKey(serverKey);
		resolveSession(session);
		init(session);
	} catch (e) {
		console.log(e);
		resolveSession();
		Meteor.connection._stream._launchConnectionAsync();
	}
}

initEncryptedSession();

const _jqueryCall = APIClient._jqueryCall.bind(APIClient);

APIClient._jqueryCall = async (method, endpoint, params, body, headers = {}): Promise<any> => {
	const session = await sessionPromise;

	if (!session) {
		return _jqueryCall(method, endpoint, params, body, headers);
	}

	console.log('override', method, endpoint);
	const result = await _jqueryCall(method, endpoint, params, body, headers, 'text');
	const decrypted = await session.decrypt(result);
	const parsed = JSON.parse(decrypted);
	console.log(parsed);
	return parsed;
};
