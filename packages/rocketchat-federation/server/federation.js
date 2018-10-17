import PeerClient from './peerClient';
import PeerServer from './peerServer';

if (!!RocketChat.settings.get('FEDERATION_Enabled') === true) {
	// Normalize the config values
	const config = {
		identifier: RocketChat.settings.get('FEDERATION_Peer_Identifier'),
		domains: (RocketChat.settings.get('FEDERATION_Peer_Domains') || '').split(','),
		dns: {
			url: RocketChat.settings.get('FEDERATION_DNS_URL'),
		},
		peer: {
			url: RocketChat.settings.get('Site_Url'),
		},
	};

	Meteor.peerClient = new PeerClient(config);
	Meteor.peerServer = new PeerServer(config);

	const { peerClient, peerServer } = Meteor;

	Meteor.startup(() => {
		console.log('[federation] Booting...');

		// Stop if registering was not possible
		if (!peerClient.register()) { return; }

		peerServer.start();
	});
}
