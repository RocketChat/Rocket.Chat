import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import Bridge from './irc-bridge';

if (!!RocketChat.settings.get('IRC_Enabled') === true) {
	// Normalize the config values
	const config = {
		server: {
			protocol: RocketChat.settings.get('IRC_Protocol'),
			host: RocketChat.settings.get('IRC_Host'),
			port: RocketChat.settings.get('IRC_Port'),
			name: RocketChat.settings.get('IRC_Name'),
			description: RocketChat.settings.get('IRC_Description'),
		},
		passwords: {
			local: RocketChat.settings.get('IRC_Local_Password'),
			peer: RocketChat.settings.get('IRC_Peer_Password'),
		},
	};

	Meteor.ircBridge = new Bridge(config);

	Meteor.startup(() => {
		Meteor.ircBridge.init();
	});
}
