import startPeer from './peer';
import HUB from './hub';

if (!!RocketChat.settings.get('FEDERATION_Enabled') === true) {
	// Normalize the config values
	const config = {
		hub: {
			host: RocketChat.settings.get('FEDERATION_Hub_Host'),
			port: RocketChat.settings.get('FEDERATION_Hub_Port'),
		},
		peer: {
			name: RocketChat.settings.get('FEDERATION_Peer_Name'),
			host: RocketChat.settings.get('FEDERATION_Peer_Host'),
			port: RocketChat.settings.get('FEDERATION_Peer_Port'),
		},
	};

	Meteor.federationHUB = new HUB(config);

	Meteor.startup(() => {
		console.log('Federation is running...');

		Meteor.federationHUB.register();

		startPeer(config);
	});
}
