import Bridge from '../irc-bridge';

Meteor.methods({
	resetIrcConnection() {
		if (!!RocketChat.settings.get('IRC_Enabled') === true) {
			if (Meteor.ircBridge) {
				Meteor.ircBridge.init();
				return {
					message: 'Connection_Reset',
					params: []
				};
			}

			// Normalize the config values
			const config = {
				server: {
					protocol: RocketChat.settings.get('IRC_Protocol'),
					host: RocketChat.settings.get('IRC_Host'),
					port: RocketChat.settings.get('IRC_Port'),
					name: RocketChat.settings.get('IRC_Name'),
					description: RocketChat.settings.get('IRC_Description')
				},
				passwords: {
					local: RocketChat.settings.get('IRC_Local_Password'),
					peer: RocketChat.settings.get('IRC_Peer_Password')
				}
			};

			Meteor.ircBridge = new Bridge(config);
			Meteor.ircBridge.init();

			return {
				message: 'Connection_Reset',
				params: []
			};
		} else if (Meteor.ircBridge) {
			Meteor.ircBridge.stop();
			return {
				message: 'Connection_Closed',
				params: []
			};
		}

		throw new Meteor.Error(t('IRC_Federation_Disabled'));
	}
});
