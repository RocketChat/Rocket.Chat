import PeerClient from './peerClient';
import PeerServer from './peerServer';

if (!!RocketChat.settings.get('FEDERATION_Enabled') === true) {

	// Verify config
	const identifier = RocketChat.settings.get('FEDERATION_Peer_Identifier');
	const domains = RocketChat.settings.get('FEDERATION_Peer_Domains');
	const hubUrl = RocketChat.settings.get('FEDERATION_Hub_URL');
	const peerUrl = RocketChat.settings.get('Site_Url');

	if (!identifier || !domains || !hubUrl || !peerUrl) {
		console.log('[federation] Configuration is not correct, federation is NOT running.');
		console.log(`[federation] identifier:${ identifier } | domains:${ domains } | hub:${ hubUrl } | peer:${ peerUrl }`);
		return;
	}

	// Normalize the config values
	const config = {
		identifier: identifier.replace('@', ''),
		domains: domains.split(',').map((d) => d.replace('@', '').trim()),
		hub: {
			url: hubUrl.replace(/\/+$/, ''),
		},
		peer: {
			url: peerUrl.replace(/\/+$/, ''),
		},
	};

	Meteor.federationLocalIdentifier = config.identifier;
	Meteor.federationPeerClient = new PeerClient(config);
	Meteor.federationPeerServer = new PeerServer(config);

	const { federationPeerClient, federationPeerServer } = Meteor;

	Meteor.startup(() => {
		console.log('[federation] Booting...');

		// Stop if registering was not possible
		if (!federationPeerClient.register()) { return; }

		federationPeerServer.start();
	});
}
