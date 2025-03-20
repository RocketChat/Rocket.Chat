function PASS() {
	this.log('Received PASS command, continue registering...');

	this.registerSteps.push('PASS');
}

function SERVER(parsedMessage) {
	this.log('Received SERVER command, waiting for first PING...');

	this.serverPrefix = parsedMessage.prefix;

	this.registerSteps.push('SERVER');
}

function PING() {
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

function NICK(parsedMessage) {
	let command;

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

function JOIN(parsedMessage) {
	const command = {
		identifier: 'joinedChannel',
		args: {
			roomName: parsedMessage.args[0].substring(1),
			nick: parsedMessage.prefix,
		},
	};

	return command;
}

function PART(parsedMessage) {
	const command = {
		identifier: 'leftChannel',
		args: {
			roomName: parsedMessage.args[0].substring(1),
			nick: parsedMessage.prefix,
		},
	};

	return command;
}

function PRIVMSG(parsedMessage) {
	const command = {
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

function QUIT(parsedMessage) {
	const command = {
		identifier: 'disconnected',
		args: {
			nick: parsedMessage.prefix,
		},
	};

	return command;
}

export default { PASS, SERVER, PING, NICK, JOIN, PART, PRIVMSG, QUIT };
