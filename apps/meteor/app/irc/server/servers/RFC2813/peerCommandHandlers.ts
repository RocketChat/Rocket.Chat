type ParsedMessage = {
	prefix?: string;
	command: string;
	args: string[];
	nick?: string;
};

type CommandResult = {
	identifier: string;
	args: Record<string, any>;
};

type RFC2813Context = {
	log: (message: string) => void;
	registerSteps: string[];
	serverPrefix: string | null;
	isRegistered: boolean;
	emit: (event: string) => void;
	write: (command: { prefix?: string; command: string; parameters?: string[] }) => void;
	config: {
		server: {
			name: string;
		};
	};
};

function PASS(this: RFC2813Context): void {
	this.log('Received PASS command, continue registering...');

	this.registerSteps.push('PASS');
}

function SERVER(this: RFC2813Context, parsedMessage: ParsedMessage): void {
	this.log('Received SERVER command, waiting for first PING...');

	this.serverPrefix = parsedMessage.prefix || null;

	this.registerSteps.push('SERVER');
}

function PING(this: RFC2813Context): void {
	if (!this.isRegistered && this.registerSteps.length === 2) {
		this.log('Received first PING command, server is registered!');

		this.isRegistered = true;

		this.emit('registered');
	}

	this.write({
		prefix: this.config.server.name,
		command: 'PONG',
		parameters: [this.config.server.name],
	});
}

function NICK(this: RFC2813Context, parsedMessage: ParsedMessage): CommandResult {
	let command: CommandResult;

	// Check if the message comes from the server,
	// which means it is a new user
	if (parsedMessage.prefix === this.serverPrefix) {
		command = {
			identifier: 'userRegistered',
			args: {
				nick: parsedMessage.args[0],
				username: parsedMessage.args[2],
				host: parsedMessage.args[3],
				name: parsedMessage.args[6],
			},
		};
	} else {
		// Otherwise, it is a nick change
		command = {
			identifier: 'nickChanged',
			args: {
				nick: parsedMessage.nick,
				newNick: parsedMessage.args[0],
			},
		};
	}

	return command;
}

function JOIN(this: RFC2813Context, parsedMessage: ParsedMessage): CommandResult {
	const command = {
		identifier: 'joinedChannel',
		args: {
			roomName: parsedMessage.args[0].substring(1),
			nick: parsedMessage.prefix,
		},
	};

	return command;
}

function PART(this: RFC2813Context, parsedMessage: ParsedMessage): CommandResult {
	const command = {
		identifier: 'leftChannel',
		args: {
			roomName: parsedMessage.args[0].substring(1),
			nick: parsedMessage.prefix,
		},
	};

	return command;
}

function PRIVMSG(this: RFC2813Context, parsedMessage: ParsedMessage): CommandResult {
	const command: CommandResult = {
		identifier: 'sentMessage',
		args: {
			nick: parsedMessage.prefix,
			message: parsedMessage.args[1],
		},
	};

	if (parsedMessage.args[0][0] === '#') {
		command.args.roomName = parsedMessage.args[0].substring(1);
	} else {
		command.args.recipientNick = parsedMessage.args[0];
	}

	return command;
}

function QUIT(this: RFC2813Context, parsedMessage: ParsedMessage): CommandResult {
	const command = {
		identifier: 'disconnected',
		args: {
			nick: parsedMessage.prefix,
		},
	};

	return command;
}

export default { PASS, SERVER, PING, NICK, JOIN, PART, PRIVMSG, QUIT };
