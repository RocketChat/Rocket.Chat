import { ClientSession } from 'ecdh-proxy';
import { Meteor } from 'meteor/meteor';

function init(session: ClientSession): void {
	Meteor.connection._stream._launchConnectionAsync();

	// Meteor.connection._stream.socket._options.debug = true;

	const _didMessage = Meteor.connection._stream.socket._didMessage.bind(Meteor.connection._stream.socket);
	const send = Meteor.connection._stream.socket.send.bind(Meteor.connection._stream.socket);

	Meteor.connection._stream.socket._didMessage = async (data: string): Promise<void> => {
		console.log('received', { data });
		const decryptedData = await session.decrypt(data);
		console.log('received', { decryptedData });
		_didMessage(decryptedData);
	};

	Meteor.connection._stream.socket.send = async (data: string): Promise<void> => {
		console.log('sending', data);
		send.call(Meteor.connection._stream.socket, await session.encrypt(data));
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
			return Meteor.connection._stream._launchConnectionAsync();
		}

		const serverKey = await response.text();
		console.log({ serverKey });

		await session.setServerKey(serverKey);
		init(session);
	} catch (e) {
		console.log(e);
		Meteor.connection._stream._launchConnectionAsync();
	}
}

initEncryptedSession();
