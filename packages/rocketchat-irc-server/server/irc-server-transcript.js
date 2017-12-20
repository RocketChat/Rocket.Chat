import net from 'net';
import _ from 'underscore';

const bind = function(f) {
	const g = Meteor.bindEnvironment((self, ...args) => f.apply(self, args));
	return function(...args) { return g(this, ...Array.from(args)); };
};

class IrcServer {
	constructor() {
		this.connect = this.connect.bind(this);
		this.disconnect = this.disconnect.bind(this);
		this.onConnect = this.onConnect.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onTimeout = this.onTimeout.bind(this);
		this.onError = this.onError.bind(this);
		this.cleanup = this.cleanup.bind(this);
		this.burst = this.burst.bind(this);
		this.sendUser = this.sendUser.bind(this);
		this.sendRoom = this.sendRoom.bind(this);
		this.joinRoom = this.joinRoom.bind(this);
		this.loginUser = this.loginUser.bind(this);
		this.leaveRoom = this.leaveRoom.bind(this);
		this.createRoom = this.createRoom.bind(this);
		this.logoutUser = this.logoutUser.bind(this);
		this.sendMessage = this.sendMessage.bind(this);
		this.logoutIrcUser = this.logoutIrcUser.bind(this);
		this.cleanupIrcServer = this.cleanupIrcServer.bind(this);
		this.getTime = this.getTime.bind(this);
		this.parseMessage = this.parseMessage.bind(this);
		this.writeCommand = this.writeCommand.bind(this);
		this.handleMalformed = this.handleMalformed.bind(this);
		this.onReceiveRawMessage = this.onReceiveRawMessage.bind(this);
		this.onReceivePASS = this.onReceivePASS.bind(this);
		this.onReceiveCAPAB = this.onReceiveCAPAB.bind(this);
		this.onReceiveSERVER = this.onReceiveSERVER.bind(this);
		this.onReceiveSVINFO = this.onReceiveSVINFO.bind(this);
		this.onReceiveSID = this.onReceiveSID.bind(this);
		this.onReceiveSJOIN = this.onReceiveSJOIN.bind(this);
		this.onReceiveUID = this.onReceiveUID.bind(this);
		this.onReceivePING = this.onReceivePING.bind(this);
		this.onReceivePONG = this.onReceivePONG.bind(this);
		this.onReceiveEOB = this.onReceiveEOB.bind(this);
		this.onReceiveJOIN = this.onReceiveJOIN.bind(this);
		this.onReceivePART = this.onReceivePART.bind(this);
		this.onReceiveQUIT = this.onReceiveQUIT.bind(this);
		this.onReceiveINVITE = this.onReceiveINVITE.bind(this);
		this.onReceiveKICK = this.onReceiveKICK.bind(this);
		this.onReceiveSQUIT = this.onReceiveSQUIT.bind(this);
		this.onReceivePRIVMSG = this.onReceivePRIVMSG.bind(this);

		// TODO: Make configurable by admin on settings
		this.ircPort = 6666;
		this.ircHost = 'localhost';
		this.serverId = '777';
		this.sendPassword = 'password';
		this.receivePassword = 'password';
		this.serverName = 'rocket.chat';
		this.serverDescription = 'federated rocketchat server';

		this.logCommands = true;

		this.ircServers = {};
		this.ircUsers = {};
		this.localUsersById = {};
		this.localUsersByIrcId = {};
		this.nextUid = parseInt('a00001', 36);

		this.socket = new net.Socket;
		this.socket.setNoDelay; // TODO It's really necessary?
		this.socket.setEncoding('utf-8');
		this.socket.setKeepAlive(true);
		this.socket.setTimeout(90000);

		this.onConnect = bind(this.onConnect);
		this.onClose = bind(this.onClose);
		this.onTimeout = bind(this.onTimeout);
		this.onError = bind(this.onError);
		this.onReceiveRawMessage = bind(this.onReceiveRawMessage);

		this.socket.on('data', this.onReceiveRawMessage);
		this.socket.on('close', this.onClose);
		this.socket.on('timeout', this.onTimeout);
		this.socket.on('error', this.onError);

		this.partialMessage = '';

		this.state = 'waitingforconnection';
	}

	connect() {
		console.log(`[irc-server] Attempting connection to IRC on ${ this.ircHost }:${ this.ircPort }`);
		this.socket.connect(this.ircPort, this.ircHost, this.onConnect);
		return this.state = 'connecting';
	}

	disconnect() {
		this.socket.end();
		this.state = 'waitingforconnection';
		return this.cleanup();
	}

	onConnect() {
		this.writeCommand({
			command: 'PASS',
			parameters: [this.sendPassword, 'TS', 6, this.serverId]
		});

		this.writeCommand({
			command: 'CAPAB',
			trailer: 'TBURST EOB ENCAP'
		});

		this.writeCommand({
			command: 'SERVER', parameters: [this.serverName, 1],
			trailer: this.serverDescription
		});

		return this.state = 'awaitingpass';
	}

	onClose() {
		console.log('[irc-server] Socket closed, cleaning up state');
		this.state = 'waitingforconnection';
		return this.cleanup();
	}

	onTimeout() {
		if (this.state === 'connected' || this.state === 'bursting') {
			return this.writeCommand({
				command: 'PING',
				trailer: this.serverId
			});
		} else {
			console.log('[irc-server] Timed out waiting for password');
			return this.disconnect();
		}
	}

	onError(error) {
		return console.log(`[irc-server] Socket error: ${ error.message }`);
	}

	cleanup() {
		this.partialMessage = '';

		if (this.ircServers.length > 0) {
			this.cleanupIrcServer(this.otherServerId);
		}

		this.localUsersById = {};

		return this.localUsersByIrcId = {};
	}

	burst() {
		const users = RocketChat.models.Users.find({statusConnection: 'online'}, { fields: { _id: 1, username: 1, status: 1, name: 1}}).fetch();
		const rooms = RocketChat.models.Rooms.find({}, {fields: { ts: 1, name: 1, usernames: 1, t: 1 } }).fetch();

		users.forEach(user => this.sendUser(user));
		rooms.forEach(room => this.sendRoom(room));

		return this.writeCommand({
			command: 'EOB',
			prefix: this.serverId
		});
	}

	sendUser(user) {
		const counterString = this.nextUid.toString().toUpperCase();

		this.nextUid = this.nextUid + 1;

		const data = _.extend(user, {nickTimestamp: this.getTime(), ircUserId: `${ this.serverId }${ counterString }`});

		this.localUsersById[data._id] = data;
		this.localUsersByIrcId[data.ircUserId] = data;

		return this.writeCommand({
			prefix: this.serverId,
			command: 'UID',
			parameters: [user.username, 1, data.nickTimestamp, '+', user.username, this.serverName, this.ircHost, data.ircUserId, '*'],
			trailer: user.name
		});
	}

	sendRoom(room) {
		if (room.t === 'd') {
			return;
		}

		const userIds = [];
		const subscribedUsers = RocketChat.models.Users.findUsersByUsernames(room.usernames, { fields: { _id: 1, statusConnection: 1 } }).fetch();

		subscribedUsers.forEach(user => {
			if (user.statusConnection === 'online') {
				return userIds.push(this.localUsersById[user._id].ircUserId);
			}
		});

		const timestamp = Math.floor(room.ts.getTime() / 1000);
		const nickSpace = 510 - 29 - room.name.length;
		const nicksPerMessage = Math.floor(nickSpace / 20);

		let index = 0;
		const result = [];

		while ((index * nicksPerMessage) < userIds.length) {
			this.writeCommand({
				prefix: this.serverId,
				command: 'SJOIN',
				parameters: [timestamp, `#${ room.name }`, '+nt'],
				trailer: userIds.slice(index * nicksPerMessage, (index + 1) * nicksPerMessage).join(' ')
			});

			result.push(index = index + 1);
		}

		return result;
	}

	joinRoom(user, room) {
		if (this.state !== 'connected') {
			return;
		}

		if (room.t === 'd' || this.localUsersById[user._id] === undefined) {
			return;
		}

		const userId = this.localUsersById[user._id].ircUserId;
		const timestamp = Math.floor(room.ts.getTime() / 1000);

		return this.writeCommand({
			prefix: userId,
			command: 'JOIN',
			parameters: [timestamp, `#${ room.name }`, '+']
		});
	}

	loginUser(user) {
		if (this.state !== 'connected') {
			return;
		}

		if (this.localUsersById[user._id] !== undefined) {
			return;
		}

		this.sendUser(user);

		// TODO: Review this function on models...
		return RocketChat.models.Rooms.findByContainigUsername(user.username, {fields: { ts: 1, name: 1, t: 1 } }).forEach(room => this.joinRoom(user, room));
	}

	leaveRoom(user, room) {
		if (this.state !== 'connected') {
			return;
		}

		// TODO: Review this test expression
		if (room.t === 'd' || this.localUsersById.includes(!user._id)) {
			return;
		}

		const userId = this.localUsersById[user._id].ircUserId;

		return this.writeCommand({
			prefix: userId,
			command: 'PART',
			parameters: [`#${ room.name }`]
		});
	}

	createRoom(owner, room) {
		if (room.t === 'd' || this.localUsersById[owner._id] === undefined) {
			return;
		}

		return this.sendRoom(room);
	}

	logoutUser(user) {
		if (this.state !== 'connected') {
			return;
		}

		// TODO: Review this test expression
		if (this.localUsersById.includes(!user._id)) {
			return;
		}

		const userId = this.localUsersById[user._id].ircUserId;
		delete this.localUsersById[user._id];
		delete this.localUsersByIrcId[userId];

		return this.writeCommand({
			prefix: userId,
			command: 'PART',
			trailer: 'Signed out'
		});
	}

	sendMessage(message, room) {
		if (this.state !== 'connected') {
			return;
		}

		if (this.localUsersById[message.u._id] === undefined) {
			return;
		}

		const userId = this.localUsersById[message.u._id].ircUserId;

		const lines = message.msg.split('\n');

		const result = [];

		lines.forEach(line => {
			let messageSpace;
			let target;

			line = line.trimRight();

			if (room.t === 'd') {
				messageSpace = 510 - 30;

				//TODO: Change for native ES6 filter maybe?
				const targetUsername = _.find(room.usernames, username => username !== message.u.username);
				const targetUser = _.find(this.ircUsers, user => user.username === targetUsername);

				target = targetUser.ircUserId;
			} else {
				//TODO: Should only send message if there are IRC users in the room
				messageSpace = 510 - 22 - room.name.length;
				target = `#${ room.name }`;
			}

			let index = 0;

			result.push(() => {
				const elementResult = [];

				while ((index * messageSpace) < line.length) {
					this.writeCommand({
						prefix: userId,
						command: 'PRIVMSG',
						parameters: [target],
						trailer: line.substring(index * messageSpace, (index + 1) * messageSpace)
					});

					elementResult.push(index = index + 1);
				}

				return elementResult;
			});
		});

		return result;
	}

	logoutIrcUser(userId) {
		const user = this.ircUsers[userId];

		Meteor.users.update({_id: user._id}, {
			$set: {
				status: 'offline'
			}
		});

		RocketChat.models.Rooms.removeUsernameFromAll(user.username);

		return delete this.ircUsers[userId];
	}

	cleanupIrcServer(serverId) {
		const disconnectedIds = [];
		let queue = [serverId];

		while (queue.length > 0) {
			const id = queue.pop();

			disconnectedIds.push(id);

			queue = queue.concat(this.ircServers[id].proxiesServers);

			delete this.ircServers[id];
		}

		return _.filter(this.ircUsers, user => disconnectedIds.includes(user.connectedTo)).forEach(this.logoutIrcUser);
	}

	getDirectRoom(source, target) {
		const rid = [source._id, target._id].sort().join('');
		const now = new Date();

		RocketChat.models.Rooms.upsert({_id: rid}, {
			$set: {
				usernames: [source.username, target.username]
			},
			$setOnInsert: {
				t: 'd',
				msgs: 0,
				ts: now
			}
		});

		RocketChat.models.Subscriptions.upsert({rid, $and: [{'u._id': target._id}]}, {
			$setOnInsert: {
				name: source.username,
				t: 'd',
				open: false,
				alert: false,
				unread: 0,
				u: {
					_id: target._id,
					username: target.username
				}
			}
		});

		return {
			_id: rid,
			t: 'd'
		};
	}

	getTime() {
		return Math.floor(Date.now() / 1000);
	}

	parseMessage(command) {
		let currentIndex = 0;
		let temp;
		let split;

		const result = {};

		if (command.length === 0) {
			return result;
		}

		if (command[0] === ':') {
			split = command.indexOf(' ', currentIndex);

			result.prefix = () => {
				if (split === -1) {
					currentIndex = command.length;
					return command.substring(1);
				} else {
					temp = command.substring(currentIndex+1, split);
					currentIndex = split + 1;
					return temp;
				}
			};
		}

		if (currentIndex !== command.length) {
			split = command.indexOf(' ', currentIndex);

			result.command = () => {
				if (split === -1) {
					temp = command.substring(currentIndex);
					currentIndex = command.length;
					return temp;
				} else {
					temp = command.substring(currentIndex, split);
					currentIndex = split + 1;
					return temp;
				}
			};
		}

		result.parameters = () => {
			const elementResult = [];

			while ((currentIndex !== command.length) && (command[currentIndex] !== ':')) {
				split = command.indexOf(' ', currentIndex);

				if (split === -1) {
					temp = command.substring(currentIndex);
					currentIndex = command.length;
					elementResult.push(temp);
				} else {
					temp = command.substring(currentIndex, split);
					currentIndex = split + 1;
					elementResult.push(temp);
				}
			}

			return elementResult;
		};

		if (currentIndex !== command.length) {
			result.trailer = command.substring(currentIndex + 1);
		}

		return result;
	}

	writeCommand(command) {
		let buffer = (command.prefix != null) ? `:${ command.prefix } ` : '';
		buffer += command.command;

		if ((command.parameters != null) && (command.parameters.length > 0)) {
			buffer += ` ${ command.parameters.join(' ') }`;
		}

		if (command.trailer != null) {
			buffer += ` :${ command.trailer }`;
		}

		if (this.logCommands) {
			console.log(`[irc-server] Sending Command: ${ buffer }`);
		}

		return this.socket.write(`${ buffer }\r\n`);
	}

	handleMalformed(command) {
		return console.log(`[irc-server] Received invalid command: ${ command }`);
	}

	onReceiveRawMessage(data) {
		const dataString = data.toString();
		const lines = dataString.split('\r\n');

		let newPartialMessage = '';
		if (dataString.substr(dataString.length - 2) !== '\n') {
			newPartialMessage = lines.pop();
		}

		let firstLine = true;

		lines.forEach(line => {
			line = line.trim();

			if (firstLine) {
				line = this.partialMessage + line;
				firstLine = false;
			}

			if (this.logCommands) {
				console.log(`[irc-server] Received command: ${ line }`);
			}

			const command = this.parseMessage(line);

			if (command.command != null) {
				switch (this.state) {
					case 'awaitingpass':
						if (command.command === 'PASS') {
							this.onReceivePASS(command);
						}
						break;
					case 'bursting':
						switch (command.command) {
							case 'CAPAB':
								this.onReceiveCAPAB(command);
								break;
							case 'SERVER':
								this.onReceiveSERVER(command);
								break;
							case 'SVINFO':
								this.onReceiveSVINFO(command);
								break;
							case 'UID':
								this.onReceiveUID(command);
								break;
							case 'SID':
								this.onReceiveSID(command);
								break;
							case 'SJOIN':
								this.onReceiveSJOIN(command);
								break;
							case 'PING':
								this.onReceivePING(command);
								break;
							case 'PONG':
								this.onReceivePONG(command);
								break;
							case 'INVITE':
								this.onReceiveINVITE(command);
								break;
							case 'KICK':
								this.onReceiveKICK(command);
								break;
						}
						break;
					case 'connected':
						switch (command.command) {
							case 'PING':
								this.onReceivePING(command);
								break;
							case 'PONG':
								this.onReceivePONG(command);
								break;
							case 'EOB':
								this.onReceiveEOB(command);
								break;
							case 'UID':
								this.onReceiveUID(command);
								break;
							case 'SID':
								this.onReceiveSID(command);
								break;
							case 'SJOIN':
								this.onReceiveSJOIN(command);
								break;
							case 'SQUIT':
								this.onReceiveSQUIT(command);
								break;
							case 'JOIN':
								this.onReceiveJOIN(command);
								break;
							case 'PART':
								this.onReceivePART(command);
								break;
							case 'QUIT':
								this.onReceiveQUIT(command);
								break;
							case 'INVITE':
								this.onReceiveINVITE(command);
								break;
							case 'KICK':
								this.onReceiveKICK(command);
								break;
							case 'PRIVMSG':
								this.onReceivePRIVMSG(command);
								break;
						}
						break;
				}
			}
		});

		return this.partialMessage = newPartialMessage;
	}

	onReceivePASS(command) {
		if (command.parameters.length !== 4) {
			this.handleMalformed(command);
			this.disconnect();
			return;
		}

		const [password, protocol, protocolVersion, otherServerId] = command.parameters;

		this.otherServerId = otherServerId;

		if (password !== this.receivePassword) {
			this.disconnect();
			return;
		}
		if (protocol !== 'TS' || protocolVersion !== '6') {
			this.disconnect();
			return;
		}

		this.ircServers[this.otherServerId] = {proxiesServers: []};
		return this.state = 'bursting';
	}

	onReceiveCAPAB(command) {
		// TODO: Review it
		return this.otherServerCapabilities = command.trailer.split(' ');
	}

	onReceiveSERVER(command) {
		if (command.parameters.length !== 2 || command.trailer == null) {
			this.handleMalformed(command);
			this.disconnect();
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [serverName, hopCount] = command.parameters;
		this.otherServerName = serverName;

		return this.ircServers[this.otherServerId].serverName = serverName;
	}

	onReceiveSVINFO(command) {
		if (!command.parameters || command.parameters.length !== 3 || command.trailer == null) {
			this.handleMalformed(command);
			this.disconnect();
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [minTS, maxTS, discard] = command.parameters;

		// eslint-disable-next-line no-unused-vars
		const timestamp = command.trailer;

		if (minTS > 6 || maxTS < 6) {
			this.disconnect();
			return;
		}

		console.log('[irc-server] Successfully connected to IRC server, starting to burst');

		this.writeCommand({
			prefix: this.serverId,
			command: 'SVINFO',
			parameters: [6, 6, 0],
			trailer: this.getTime()
		});

		this.burst();
		console.log('[irc-server] Finished bursting');

		return this.state = 'connected';
	}

	onReceiveSID(command) {
		// TODO Transform to Meteor check...
		if (!command.parameters || command.parameters.length !== 3 || command.trailer == null || command.prefix == null) {
			this.handleMalformed(command);
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [serverName, hopCount, serverId] = command.parameters;
		const connectedTo = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const serverDescription = command.trailer;

		this.ircServers[serverId] = {serverName, proxiesServers: []};
		this.ircServers[connectedTo].proxiesServers.push(serverId);

		// TODO It's right? Return log console?
		return console.log(`[irc-server] New server connected: ${ serverName } via ${ this.ircServers[connectedTo].serverName }`);
	}

	onReceiveSJOIN(command) {
		// TODO Transform to Meteor check...
		if (command.parameters.length !== 3 || command.trailer == null) {
			this.handleMalformed(command);
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [channelTimestamp, channel, mode] = command.parameters;

		const userIds = command.trailer.split(' ');

		const users = _.map(userIds, id => {
			return {
				username: this.ircUsers[id.substring(id.length-9)].username,
				isOperator: id[0] === '@'
			};

		});

		let room = RocketChat.models.Rooms.findOneByName(channel.substring(1));

		if ((room == null)) {
			const firstOperator = _.find(users, user => user.isOperator);
			if ((firstOperator == null)) {
				return;
			}

			RocketChat.createRoom('c', channel.substring(1), firstOperator.username, [], false);

			room = RocketChat.models.Rooms.findOneByName(channel.substring(1));
		}

		return RocketChat.models.Rooms.addUsernamesById(room._id, _.map(users, user => user.username));
	}

	onReceiveUID(command) {
		if (command.parameters.length !== 9) {
			this.handleMalformed(command);
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [nick, hopCount, nickTimestamp, umodes, username, hostname, ipAddess, userId, gecos] = command.parameters;
		const connectedTo = command.prefix;

		//TODO Handle nick collisions
		//TODO Handle verification that irc and rocketchat users are the same
		//TODO Handle modes
		const user = Meteor.users.findOne({name: nick});

		if (!user) {
			Meteor.call('registerUser', {
				email: `${ nick }@irc.redhat.com`,
				pass: '',
				name: nick
			});

			Meteor.users.update({_id: user._id}, {
				$set: {
					username: nick,
					ircOnly: true
				}
			});
		}

		Meteor.users.update({_id: user._id}, {
			$set: {
				status: 'online'
			}
		});

		user.nickTimestamp = nickTimestamp;
		user.connectedTo = connectedTo;
		user.ircUserId = userId;

		this.ircUsers[userId] = user;

		return console.log(`[irc-server] Registered user ${ nick } with userId ${ userId }`);
	}

	onReceivePING(command) {
		const source = command.trailer;
		return this.writeCommand({prefix: this.serverId, command: 'PONG', parameters: [this.serverName], trailer: source});
	}

	onReceivePONG(command) {
		// eslint-disable-next-line no-unused-vars
		let targetServerId;

		// eslint-disable-next-line no-unused-vars
		const source = command.trailer;

		// eslint-disable-next-line no-unused-vars
		const [sourceServerName] = command.parameters;

		return targetServerId = command.trailer;
	}

	onReceiveEOB(command) {
		const serverId = command.prefix;

		return console.log(`[irc-server] Finished receiving burst from ${ this.ircServers[serverId].serverName }`);
	}

	onReceiveJOIN(command) {
		const userId = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const [channelTimestamp, channel] = command.parameters;

		return RocketChat.models.Rooms.addUsernameByName(channel.substring(1), this.ircUsers[userId].username);
	}

	onReceivePART(command) {
		const userId = command.prefix;
		const [channel] = command.parameters;

		return RocketChat.models.Rooms.removeUsernameByName(channel.substring(1), this.ircUsers[userId].username);
	}

	onReceiveQUIT(command) {
		const userId = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const reason = command.trailer;

		return this.logoutIrcUser(userId);
	}

	onReceiveINVITE(command) {
		const invitingUserId = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const [invitedUserId, channel, channelTimestamp] = command.parameters;

		const invitingUser = this.ircUsers[invitingUserId];
		if ((invitingUser == null)) {
			return;
		}

		const invitedUser = this.localUsersByIrcId[invitedUserId];
		if ((invitedUser == null)) {
			return;
		}

		const room = RocketChat.models.Rooms.findOneByName(channel.substring(1));
		if ((room == null)) {
			return;
		}

		console.log(`[irc-server] Inviting ${ invitedUser.username } to ${ room.name }`);

		return Meteor.runAsUser(invitingUser._id, () => {
			return Meteor.call('addUserToRoom', {
				rid: room._id,
				username: invitedUser.username
			});
		});
	}

	onReceiveKICK(command) {
		const kickingUserId = command.prefix;
		const [channel, kickedUserId] = command.parameters;

		const kickingUser = this.ircUsers[kickingUserId];
		if ((kickingUser == null)) {
			return;
		}

		const kickedUser = this.localUsersByIrcId[kickedUserId];
		if ((kickedUser == null)) {
			return;
		}

		const room = RocketChat.models.Rooms.findOneByName(channel.substring(1));
		if ((room == null)) {
			return;
		}

		console.log(`[irc-server] Kicking ${ kickedUser.username } from ${ room.name }`);

		return Meteor.runAsUser(kickingUser._id, () => {
			return Meteor.call('removeUserFromRoom', {
				rid: room._id,
				username: kickedUser.username
			});
		});
	}

	onReceiveSQUIT(command) {
		let [targetServer] = command.parameters;

		// eslint-disable-next-line no-unused-vars
		const comment = command.trailer;

		if (targetServer === this.serverId) {
			targetServer = this.otherServerId;
		}

		console.log(`[irc-server] IRC server disconnecting: ${ this.ircServers[targetServer].serverName }`);
		return this.cleanupIrcServer(targetServer);
	}

	onReceivePRIVMSG(command) {
		let room;

		const userId = command.prefix;
		const [channel] = command.parameters;
		const content = command.trailer;
		const user = this.ircUsers[userId];

		if (channel[0] === '#') {
			room = RocketChat.models.Rooms.findOneByName(channel.substring(1));
		} else {
			//TODO Handle direct messages
			const targetUser = this.localUsersByIrcId[channel];
			room = this.getDirectRoom(user, targetUser);
		}

		const message = {
			msg: content,
			ts: new Date()
		};

		return RocketChat.sendMessage(user, message, room);
	}
}

const ircServer = new IrcServer;

const IrcServerLoginer = function(login) {
	if (login.user != null) { ircServer.loginUser(login.user); }
	return login;
};

const IrcServerSender = (message, room) => ircServer.sendMessage(message, room);

const IrcServerRoomJoiner = function(user, room) {
	ircServer.joinRoom(user, room);
	return room;
};

const IrcServerRoomLeaver = function(user, room) {
	ircServer.leaveRoom(user, room);
	return room;
};

const IrcServerLogoutCleanUper = function(user) {
	ircServer.logoutUser(user);
	return user;
};

const IrcServerRoomCreator = (owner, room) => ircServer.createRoom(owner, room);

RocketChat.callbacks.add('afterValidateLogin', IrcServerLoginer, RocketChat.callbacks.priority.LOW, 'irc-server-loginer');
RocketChat.callbacks.add('afterSaveMessage', IrcServerSender, RocketChat.callbacks.priority.LOW, 'irc-server-sender');
RocketChat.callbacks.add('beforeJoinRoom', IrcServerRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-server-room-joiner');
RocketChat.callbacks.add('beforeCreateChannel', IrcServerRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-server-room-joiner-create-channel');
RocketChat.callbacks.add('beforeLeaveRoom', IrcServerRoomLeaver, RocketChat.callbacks.priority.LOW, 'irc-server-room-leaver');
RocketChat.callbacks.add('afterLogoutCleanUp', IrcServerLogoutCleanUper, RocketChat.callbacks.priority.LOW, 'irc-server-clean-up');
RocketChat.callbacks.add('afterCreateRoom', IrcServerRoomCreator, RocketChat.callbacks.priority.LOW, 'irc-server-room-creator');

Meteor.startup(() => {
	Meteor.setTimeout((() => ircServer.connect()), 30000);
});
