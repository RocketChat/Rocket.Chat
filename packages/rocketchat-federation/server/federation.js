import PeerClient from './peerClient';
import PeerServer from './peerServer';

if (!!RocketChat.settings.get('FEDERATION_Enabled') === true) {
	// Normalize the config values
	const config = {
		identifier: RocketChat.settings.get('FEDERATION_Peer_Identifier'),
		client: {
			hub: {
				host: RocketChat.settings.get('FEDERATION_Hub_Host'),
				port: RocketChat.settings.get('FEDERATION_Hub_Port'),
			},
		},
		server: {
			host: RocketChat.settings.get('FEDERATION_Peer_Server_Host'),
			port: RocketChat.settings.get('FEDERATION_Peer_Server_Port'),
		},
	};

	const peerClient = new PeerClient(config);
	const peerServer = new PeerServer(config);

	Meteor.startup(() => {
		console.log('[federation] Starting!');

		peerServer.start();
		peerClient.register();
	});
}
