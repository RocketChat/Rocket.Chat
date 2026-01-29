type RFC2813Context = {
	write: (command: { prefix?: string; command: string; parameters?: string[]; trailer?: string }) => void;
	config: {
		server: {
			name: string;
		};
	};
};

type RegisterUserParameters = {
	name: string;
	profile: {
		irc: {
			nick: string;
			username: string;
		};
	};
};

type JoinChannelParameters = {
	room: {
		name: string;
	};
	user: {
		profile: {
			irc: {
				nick: string;
			};
		};
	};
};

type JoinedChannelParameters = {
	room?: {
		name?: string;
	};
	user?: {
		profile?: {
			irc?: {
				nick?: string;
			};
		};
	};
};

type LeftChannelParameters = {
	room: {
		name: string;
	};
	user: {
		profile: {
			irc: {
				nick: string;
			};
		};
	};
};

type SentMessageParameters = {
	user: {
		profile: {
			irc: {
				nick: string;
			};
		};
	};
	to: string;
	message: string;
};

type DisconnectedParameters = {
	user: {
		profile: {
			irc: {
				nick: string;
			};
		};
	};
};

type Handler = {
	log: (message: string) => void;
};

function registerUser(this: RFC2813Context, parameters: RegisterUserParameters): void {
	const {
		name,
		profile: {
			irc: { nick, username },
		},
	} = parameters;

	this.write({
		prefix: this.config.server.name,
		command: 'NICK',
		parameters: [nick, '1', username, 'irc.rocket.chat', '1', '+i'],
		trailer: name,
	});
}

function joinChannel(this: RFC2813Context, parameters: JoinChannelParameters): void {
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

function joinedChannel(this: RFC2813Context, parameters: JoinedChannelParameters, handler: Handler): void {
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

function leftChannel(this: RFC2813Context, parameters: LeftChannelParameters): void {
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

function sentMessage(this: RFC2813Context, parameters: SentMessageParameters): void {
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

function disconnected(this: RFC2813Context, parameters: DisconnectedParameters): void {
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
