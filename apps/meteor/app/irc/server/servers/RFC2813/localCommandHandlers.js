function registerUser(parameters) {
	const {
		name,
		profile: {
			irc: { nick, username },
		},
	} = parameters;

	this.write({
		prefix: this.config.server.name,
		command: 'NICK',
		parameters: [nick, 1, username, 'irc.rocket.chat', 1, '+i'],
		trailer: name,
	});
}

function joinChannel(parameters) {
	const {
		room: { name: roomName },
		user: {
			profile: {
				irc: { nick },
			},
		},
	} = parameters;

	this.write({
		prefix: this.config.server.name,
		command: 'NJOIN',
		parameters: [`#${roomName}`],
		trailer: nick,
	});
}

function joinedChannel(parameters, handler) {
	const roomName = parameters.room?.name;
	const nick = parameters.user?.profile?.irc?.nick;

	if (!roomName) {
		handler.log('Skipping room with no name.');
		return;
	}

	if (!nick) {
		handler.log('Skipping user with no irc nick.');
		return;
	}

	this.write({
		prefix: nick,
		command: 'JOIN',
		parameters: [`#${roomName}`],
	});
}

function leftChannel(parameters) {
	const {
		room: { name: roomName },
		user: {
			profile: {
				irc: { nick },
			},
		},
	} = parameters;

	this.write({
		prefix: nick,
		command: 'PART',
		parameters: [`#${roomName}`],
	});
}

function sentMessage(parameters) {
	const {
		user: {
			profile: {
				irc: { nick },
			},
		},
		to,
		message,
	} = parameters;

	// eslint-disable-next-line no-control-regex
	const lines = message.toString().split(/\r\n|\r|\n|\u0007/);
	for (const line of lines) {
		this.write({
			prefix: nick,
			command: 'PRIVMSG',
			parameters: [to],
			trailer: line,
		});
	}
}

function disconnected(parameters) {
	const {
		user: {
			profile: {
				irc: { nick },
			},
		},
	} = parameters;

	this.write({
		prefix: nick,
		command: 'QUIT',
	});
}

export default { registerUser, joinChannel, joinedChannel, leftChannel, sentMessage, disconnected };
