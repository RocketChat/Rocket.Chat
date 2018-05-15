export default {
	registerUser: (parameters) => {
		const { name, profile: { irc: { nick, username } } } = parameters;

		this.write({
			prefix: this.config.server.name,
			command: 'NICK', parameters: [ nick, 1, username, 'irc.rocket.chat', 1, '+i' ],
			trailer: name
		});
	},

	joinChannel: (parameters) => {
		const {
			room: { name: roomName },
			user: { profile: { irc: { nick } } }
		} = parameters;

		this.write({
			prefix: this.config.server.name,
			command: 'NJOIN', parameters: [ `#${ roomName }` ],
			trailer: nick
		});
	},

	joinedChannel: (parameters) => {
		const {
			room: { name: roomName },
			user: { profile: { irc: { nick } } }
		} = parameters;

		this.write({
			prefix: nick,
			command: 'JOIN', parameters: [ `#${ roomName }` ]
		});
	},

	leftChannel: (parameters) => {
		const {
			room: { name: roomName },
			user: { profile: { irc: { nick } } }
		} = parameters;

		this.write({
			prefix: nick,
			command: 'PART', parameters: [ `#${ roomName }` ]
		});
	},

	sentMessage: (parameters) => {
		const {
			user: { profile: { irc: { nick } } },
			to,
			message
		} = parameters;

		this.write({
			prefix: nick,
			command: 'PRIVMSG', parameters: [ to ],
			trailer: message
		});
	},

	disconnected: (parameters) => {
		const {
			user: { profile: { irc: { nick } } }
		} = parameters;

		this.write({
			prefix: nick,
			command: 'QUIT'
		});
	}
};
