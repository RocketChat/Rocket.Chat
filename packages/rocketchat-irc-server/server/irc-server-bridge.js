import net from 'net';
import _ from 'underscore';

class IrcServer {
	constructor() {
		this.ircPort = RocketChat.settings.get('IRC_Server_Port');
		this.ircHost = RocketChat.settings.get('IRC_Server_Host');
		this.serverId = RocketChat.settings.get('IRC_Server_Id');
		this.sendPassword = RocketChat.settings.get('IRC_Server_Send_Password');
		this.receivePassword = RocketChat.settings.get('IRC_Server_Receive_Password');
		this.serverName = RocketChat.settings.get('IRC_Server_Name');
		this.serverDescription = RocketChat.settings.get('IRC_Server_Description');

		this.logCommands = true;
		this.ircServers = {};
		this.ircUsers = {};
		this.localUsersById = {};
		this.localUsersByIrcId = {};
		this.nextUid = parseInt('a00001', 36);

		this.socket = new net.Socket;
		this.socket.setNoDelay();
		this.socket.setEncoding('utf-8');
		this.socket.setKeepAlive(true);
		this.socket.setTimeout(90000);

		this.socket.on('data', this.onReceiveRawMessage);
		this.socket.on('close', this.onClose);
		this.socket.on('timeout', this.onTimeout);
		this.socket.on('error', this.onError);

		this.partialMessage = '';

		this.state = 'waitingforconnection';
	}

	connect = () => {
		console.log(`[irc-server] Attempting connection to IRC on ${ this.ircHost }:${ this.ircPort }`);

		this.socket.connect(this.ircPort, this.ircHost, this.onConnect);

		return this.state = 'connecting';
	}

	disconnect = () => {
		this.socket.end();
		this.state = 'waitingforconnection';

		return this.cleanup();
	}

	onConnect = () => {
		console.log('SID: ', this.serverId);

		this.writeCommand({
			command: 'PASS',
			parameters: [this.sendPassword, 'TS', 6, this.serverId]
		});

		// TODO Check this... TS6 docs
		//CAPAB
		//source: unregistered server
		//propagation: none
		//parameters: space separated capability list

		//Sends capabilities of the server. This must include QS and ENCAP. It is also
		//strongly recommended to include EX, CHW, IE and KNOCK, and for charybdis TS6
		//also SAVE and EUID. For use with services, SERVICES and RSFNC are strongly
		//recommended.
		this.writeCommand({
			command: 'CAPAB',
			trailer: 'TBURST EOB ENCAP EX CHW IE KNOCK SAVE EUID SERVICES RSFNC'
		});

		this.writeCommand({
			command: 'SERVER', parameters: [this.serverName, 1],
			trailer: this.serverDescription
		});

		return this.state = 'awaitingpass';
	}

	onClose = () => {
		console.log('[irc-server] Socket closed, cleaning up state');

		this.state = 'waitingforconnection';

		return this.cleanup();
	}

	onTimeout = () => {
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

	onError = (error) => {
		return console.log(`[irc-server] Socket error: ${ error.message }`);
	}

	cleanup = () => {
		this.partialMessage = '';

		if (this.ircServers.length > 0) {
			this.cleanupIrcServer(this.otherServerId);
		}

		this.localUsersById = {};

		return this.localUsersByIrcId = {};
	}

	burst = () => {
		const users = RocketChat.models.Users.find({statusConnection: 'online'}, { fields: { _id: 1, username: 1, status: 1, name: 1}}).fetch();
		const rooms = RocketChat.models.Rooms.find({}, {fields: { ts: 1, name: 1, usernames: 1, t: 1 } }).fetch();

		users.forEach(user => this.sendUser(user));
		rooms.forEach(room => this.sendRoom(room));

		return this.writeCommand({
			command: 'EOB',
			prefix: this.serverId
		});
	}

	sendUser = (user) => {
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

	sendRoom = (room) => {
		if (room.t === 'd') {
			return;
		}

		const userIds = [];
		// TODO It probably should to be limited by statusConnection equals 'online'
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

	joinRoom = (user, room) => {
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

	loginUser = (user) => {
		if (this.state !== 'connected' || this.localUsersById[user._id] !== undefined) {
			return;
		}

		this.sendUser(user);

		return RocketChat.models.Rooms.findWithUsername(user.username, {fields: { ts: 1, name: 1, t: 1 } }).forEach(room => this.joinRoom(user, room));
	}

	leaveRoom = (user, room) => {
		if (this.state !== 'connected') {
			return;
		}

		if (room.t === 'd' || !this.localUsersById.includes(user._id)) {
			return;
		}

		const userId = this.localUsersById[user._id].ircUserId;

		return this.writeCommand({
			prefix: userId,
			command: 'PART',
			parameters: [`#${ room.name }`]
		});
	}

	createRoom = (owner, room) => {
		if (room.t === 'd' || this.localUsersById[owner._id] === undefined) {
			return;
		}

		return this.sendRoom(room);
	}

	logoutUser = (user) => {
		if (this.state !== 'connected' || !user || !user.id || !this.localUsersById.includes(user._id)) {
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

	sendMessage = (message, room) => {
		if (this.state !== 'connected') {
			return;
		}

		if (this.localUsersById[message.u._id] === undefined) {
			return;
		}

		const userId = this.localUsersById[message.u._id].ircUserId;

		const lines = message.msg.split('\n');

		// TODO Refactoring this self function
		return (() => {
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

				result.push((() => {
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
				})());
			});

			return result;
		})();
	}

	logoutIrcUser = (userId) => {
		const user = this.ircUsers[userId];

		Meteor.users.update({_id: user._id}, {
			$set: {
				status: 'offline'
			}
		});

		RocketChat.models.Rooms.removeUsernameFromAll(user.username);

		return delete this.ircUsers[userId];
	}

	cleanupIrcServer = (serverId) => {
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

	getDirectRoom = (source, target) => {
		const rid = [source._id, target._id].sort().join('');

		RocketChat.models.Rooms.upsert({_id: rid}, {
			$set: {
				usernames: [source.username, target.username]
			},
			$setOnInsert: {
				t: 'd',
				msgs: 0,
				ts: new Date()
			}
		});

		RocketChat.models.Subscriptions.upsert({rid, 'u._id': target._id}, {
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

	static getTime() {
		return Math.floor(Date.now() / 1000);
	}

	parseMessage = (command) => {
		let currentIndex = 0;
		let split;

		const result = {};

		if (command.length === 0) {
			return result;
		}

		if (command[0] === ':') {
			split = command.indexOf(' ', currentIndex);

			if (split === -1) {
				currentIndex = command.length;
				result.prefix = command.substring(1);
			} else {
				result.prefix = command.substring(currentIndex+1, split);
				currentIndex = split + 1;
			}
		}

		if (currentIndex !== command.length) {
			split = command.indexOf(' ', currentIndex);

			if (split === -1) {
				result.command = command.substring(currentIndex);
				currentIndex = command.length;
			} else {
				result.command = command.substring(currentIndex, split);
				currentIndex = split + 1;
			}
		}

		result.parameters = [];

		while (currentIndex !== command.length && command[currentIndex] !== ':') {
			split = command.indexOf(' ', currentIndex);

			if (split === -1) {
				currentIndex = command.length;
				result.parameters.push(command.substring(currentIndex));
			} else {
				currentIndex = split + 1;
				result.parameters.push(command.substring(currentIndex, split));
			}
		}

		if (currentIndex !== command.length) {
			result.trailer = command.substring(currentIndex + 1);
		}

		return result;
	}

	writeCommand = (command) => {
		let buffer = command.prefix != null ? `:${ command.prefix } ` : '';
		buffer += command.command;

		if (command.parameters != null && command.parameters.length > 0) {
			buffer += ` ${ command.parameters.join(' ') }`;
		}

		if (command.trailer != null) {
			buffer += ` :${ command.trailer }`;
		}

		if (this.logCommands) {
			console.log(`[irc-server] Sending Command: ${ buffer }`);
		}

		return this.socket.write(`${ buffer }\r\n`);
	};

	static handleMalformed(command) {
		return console.log(`[irc-server] Received invalid command: ${ command }`);
	}

	onReceiveRawMessage = (data) => {
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

			if (command && command.command != null) {
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
	};

	onReceivePASS = (command) => {
		if (command.parameters.length !== 4) {
			IrcServer.handleMalformed(command);
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
	};

	// eslint-disable-next-line no-unused-vars
	onReceiveCAPAB = (command) => {
		// TODO: Review it (search git history)
		//return this.otherServerCapabilities = command.trailer.split(' ');
	};

	onReceiveSERVER = (command) => {
		if (command.parameters.length !== 2 || command.trailer == null) {
			IrcServer.handleMalformed(command);
			this.disconnect();
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [serverName, hopCount] = command.parameters;
		this.otherServerName = serverName;

		return this.ircServers[this.otherServerId].serverName = serverName;
	};

	onReceiveSVINFO = (command) => {
		if (!command.parameters || command.parameters.length !== 3 || command.trailer == null) {
			IrcServer.handleMalformed(command);
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
	};

	onReceiveSID = (command) => {
		if (!command.parameters || command.parameters.length !== 3 || command.trailer == null || command.prefix == null) {
			IrcServer.handleMalformed(command);
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [serverName, hopCount, serverId] = command.parameters;
		const connectedTo = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const serverDescription = command.trailer;

		this.ircServers[serverId] = {serverName, proxiesServers: []};
		this.ircServers[connectedTo].proxiesServers.push(serverId);

		return console.log(`[irc-server] New server connected: ${ serverName } via ${ this.ircServers[connectedTo].serverName }`);
	};

	onReceiveSJOIN = (command) => {
		if (command.parameters.length !== 3 || command.trailer == null) {
			IrcServer.handleMalformed(command);
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
			if (firstOperator == null) {
				return;
			}

			RocketChat.createRoom('c', channel.substring(1), firstOperator.username, [], false);

			room = RocketChat.models.Rooms.findOneByName(channel.substring(1));
		}

		return RocketChat.models.Rooms.addUsernamesById(room._id, _.map(users, user => user.username));
	}

	onReceiveUID = (command) => {
		console.log('IRC command.parameters (onReceiveUID): ', command.parameters);

		if (command && command.parameters && command.parameters.length !== 9) {
			IrcServer.handleMalformed(command);
			return;
		}

		// eslint-disable-next-line no-unused-vars
		const [nick, hopCount, nickTimestamp, umodes, username, hostname, ipAddess, ircUserId, gecos] = command.parameters;
		const connectedTo = command.prefix;

		//TODO Handle nick collisions
		//TODO Handle verification that irc and rocketchat users are the same (send verification code to IRC user on IRC side)

		//TODO Handle modes
		let user = RocketChat.models.Users.findOne({name: nick});

		/**
		 Nick TS collisions:
		 If both users are to be collided, we must issue a KILL for the existing
		 user to all servers.  If the new user has a UID then we must also issue a
		 KILL for that UID back to the server sending us data causing the collision.

		 If only the existing user is being collided, we must issue a KILL for the
		 existing user to all servers except the server sending us data.  If the
		 existing user has a UID and the server sending us data supports TS6 then
		 we must also issue a KILL for the existing users UID to the server sending
		 us data.

		 If only the new user is being collided, we must issue a KILL for the new user
		 back to the server sending us data if the new user has a UID.
		 **/

		if (!user) {
			const userId = Meteor.call('registerUser', {
				email: `${ nick }@${ hostname }`,
				pass: '',
				name: nick
			});

			RocketChat.models.Users.update({_id: userId}, {
				$set: {
					username: nick,
					ircOnly: true
				}
			});

			user = RocketChat.models.Users.findOne({_id: userId});
		}

		RocketChat.models.Users.update({_id: user._id}, {
			$set: {
				status: 'online'
			}
		});

		user.nickTimestamp = nickTimestamp;
		user.connectedTo = connectedTo;
		user.ircUserId = ircUserId;

		this.ircUsers[ircUserId] = user;

		return console.log(`[irc-server] Registered user ${ nick } with ircUserId ${ ircUserId }`);
	};

	onReceivePING = (command) => {
		const source = command.trailer;

		return this.writeCommand({
			prefix: this.serverId,
			command: 'PONG',
			parameters: [this.serverName],
			trailer: source
		});
	};

	onReceivePONG = (command) => {
		// eslint-disable-next-line no-unused-vars
		let targetServerId;

		// eslint-disable-next-line no-unused-vars
		const source = command.trailer;

		// eslint-disable-next-line no-unused-vars
		const [sourceServerName] = command.parameters;

		return targetServerId = command.trailer;
	};

	onReceiveEOB = (command) => {
		const serverId = command.prefix;

		return console.log(`[irc-server] Finished receiving burst from ${ this.ircServers[serverId].serverName }`);
	};

	onReceiveJOIN = (command) => {
		const userId = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const [channelTimestamp, channel] = command.parameters;

		return RocketChat.models.Rooms.addUsernameByName(channel.substring(1), this.ircUsers[userId].username);
	};

	onReceivePART = (command) => {
		const userId = command.prefix;
		const [channel] = command.parameters;

		return RocketChat.models.Rooms.removeUsernameByName(channel.substring(1), this.ircUsers[userId].username);
	};

	onReceiveQUIT = (command) => {
		const userId = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const reason = command.trailer;

		return this.logoutIrcUser(userId);
	};

	onReceiveINVITE = (command) => {
		const invitingUserId = command.prefix;

		// eslint-disable-next-line no-unused-vars
		const [invitedUserId, channel, channelTimestamp] = command.parameters;

		const invitingUser = this.ircUsers[invitingUserId];
		if (invitingUser == null) {
			return;
		}

		const invitedUser = this.localUsersByIrcId[invitedUserId];
		if (invitedUser == null) {
			return;
		}

		const room = RocketChat.models.Rooms.findOneByName(channel.substring(1));
		if (room == null) {
			return;
		}

		console.log(`[irc-server] Inviting ${ invitedUser.username } to ${ room.name }`);

		return Meteor.runAsUser(invitingUser._id, () => {
			return Meteor.call('addUserToRoom', {
				rid: room._id,
				username: invitedUser.username
			});
		});
	};

	onReceiveKICK = (command) => {
		const kickingUserId = command.prefix;
		const [channel, kickedUserId] = command.parameters;

		const kickingUser = this.ircUsers[kickingUserId];
		if (kickingUser == null) {
			return;
		}

		const kickedUser = this.localUsersByIrcId[kickedUserId];
		if (kickedUser == null) {
			return;
		}

		const room = RocketChat.models.Rooms.findOneByName(channel.substring(1));
		if (room == null) {
			return;
		}

		console.log(`[irc-server] Kicking ${ kickedUser.username } from ${ room.name }`);

		return Meteor.runAsUser(kickingUser._id, () => {
			return Meteor.call('removeUserFromRoom', {
				rid: room._id,
				username: kickedUser.username
			});
		});
	};

	onReceiveKILL = (command) => {
		const ircUserId = command.prefix;

		console.log('IRC command.parameters: ', command.parameters);

		const userForKill = this.ircUsers[ircUserId];
		if (userForKill == null || userForKill._id == null) {
			return;
		}

		const killedUser = this.localUsersByIrcId[ircUserId];
		if (killedUser == null) {
			return;
		}

		console.log(`[irc-server] Killing ${ killedUser.username }`);

		return Meteor.runAsUser(userForKill._id, () => {
			// TODO Kill user
		});
	};

	onReceiveSQUIT = (command) => {
		let [targetServer] = command.parameters;

		// eslint-disable-next-line no-unused-vars
		const comment = command.trailer;

		if (targetServer === this.serverId) {
			targetServer = this.otherServerId;
		}

		console.log(`[irc-server] IRC server disconnecting: ${ this.ircServers[targetServer].serverName }`);
		return this.cleanupIrcServer(targetServer);
	};

	onReceivePRIVMSG = (command) => {
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

if (!!RocketChat.settings.get('IRC_Server_Enabled') === true) {
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
}
