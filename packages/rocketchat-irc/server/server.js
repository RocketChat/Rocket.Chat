import _ from 'underscore';
import net from 'net';
import Lru from 'lru-cache';

///////
// Assign values

//Package availability
const IRC_AVAILABILITY = RocketChat.settings.get('IRC_Enabled');

// Cache prep
const MESSAGE_CACHE_SIZE = RocketChat.settings.get('IRC_Message_Cache_Size');
const ircReceiveMessageCache = Lru(MESSAGE_CACHE_SIZE);//eslint-disable-line
const ircSendMessageCache = Lru(MESSAGE_CACHE_SIZE);//eslint-disable-line

// IRC server
const IRC_PORT = RocketChat.settings.get('IRC_Port');
const IRC_HOST = RocketChat.settings.get('IRC_Host');

const ircClientMap = {};

//////
// Core functionality

const bind = function(f) {
	const g = Meteor.bindEnvironment((self, ...args) => f.apply(self, args));
	return function(...args) { g(this, ...args); };
};

const async = (f, ...args) => Meteor.wrapAsync(f)(...args);

class IrcClient {
	constructor(loginReq) {
		this.loginReq = loginReq;

		this.user = this.loginReq.user;
		ircClientMap[this.user._id] = this;
		this.ircPort = IRC_PORT;
		this.ircHost = IRC_HOST;
		this.msgBuf = [];

		this.isConnected = false;
		this.isDistroyed = false;
		this.socket = new net.Socket;
		this.socket.setNoDelay;
		this.socket.setEncoding('utf-8');
		this.socket.setKeepAlive(true);
		this.onConnect = bind(this.onConnect);
		this.onClose = bind(this.onClose);
		this.onTimeout = bind(this.onTimeout);
		this.onError = bind(this.onError);
		this.onReceiveRawMessage = bind(this.onReceiveRawMessage);
		this.socket.on('data', this.onReceiveRawMessage);
		this.socket.on('close', this.onClose);
		this.socket.on('timeout', this.onTimeout);
		this.socket.on('error', this.onError);

		this.isJoiningRoom = false;
		this.receiveMemberListBuf = {};
		this.pendingJoinRoomBuf = [];

		this.successLoginMessageRegex = /RocketChat.settings.get('IRC_RegEx_successLogin');/;
		this.failedLoginMessageRegex = /RocketChat.settings.get('IRC_RegEx_failedLogin');/;
		this.receiveMessageRegex = /RocketChat.settings.get('IRC_RegEx_receiveMessage');/;
		this.receiveMemberListRegex = /RocketChat.settings.get('IRC_RegEx_receiveMemberList');/;
		this.endMemberListRegex = /RocketChat.settings.get('IRC_RegEx_endMemberList');/;
		this.addMemberToRoomRegex = /RocketChat.settings.get('IRC_RegEx_addMemberToRoom');/;
		this.removeMemberFromRoomRegex = /RocketChat.settings.get('IRC_RegEx_removeMemberFromRoom');/;
		this.quitMemberRegex = /RocketChat.settings.get('IRC_RegEx_quitMember');/;
	}

	connect(loginCb) {
		this.loginCb = loginCb;
		this.socket.connect(this.ircPort, this.ircHost, this.onConnect);
		this.initRoomList();
	}

	disconnect() {
		this.isDistroyed = true;
		this.socket.destroy();
	}

	onConnect() {
		console.log('[irc] onConnect -> '.yellow, this.user.username, 'connect success.');
		this.socket.write(`NICK ${ this.user.username }\r\n`);
		this.socket.write(`USER ${ this.user.username } 0 * :${ this.user.name }\r\n`);
		// message order could not make sure here
		this.isConnected = true;
		const messageBuf = this.msgBuf;
		messageBuf.forEach(msg => this.socket.write(msg));
	}

	onClose() {
		console.log('[irc] onClose -> '.yellow, this.user.username, 'connection close.');
		this.isConnected = false;
		if (this.isDistroyed) {
			delete ircClientMap[this.user._id];
		} else {
			this.connect();
		}
	}

	onTimeout() {
		console.log('[irc] onTimeout -> '.yellow, this.user.username, 'connection timeout.', arguments);
	}

	onError() {
		console.log('[irc] onError -> '.yellow, this.user.username, 'connection error.', arguments);
	}

	onReceiveRawMessage(data) {
		data = data.toString().split('\n');

		data.forEach(line => {
			line = line.trim();
			console.log(`[${ this.ircHost }:${ this.ircPort }]:`, line);

			// Send heartbeat package to irc server
			if (line.indexOf('PING') === 0) {
				this.socket.write(line.replace('PING :', 'PONG '));
				return;
			}
			let matchResult = this.receiveMessageRegex.exec(line);
			if (matchResult) {
				this.onReceiveMessage(matchResult[1], matchResult[2], matchResult[3]);
				return;
			}
			matchResult = this.receiveMemberListRegex.exec(line);
			if (matchResult) {
				this.onReceiveMemberList(matchResult[1], matchResult[2].split(' '));
				return;
			}
			matchResult = this.endMemberListRegex.exec(line);
			if (matchResult) {
				this.onEndMemberList(matchResult[1]);
				return;
			}
			matchResult = this.addMemberToRoomRegex.exec(line);
			if (matchResult) {
				this.onAddMemberToRoom(matchResult[1], matchResult[2]);
				return;
			}
			matchResult = this.removeMemberFromRoomRegex.exec(line);
			if (matchResult) {
				this.onRemoveMemberFromRoom(matchResult[1], matchResult[2]);
				return;
			}
			matchResult = this.quitMemberRegex.exec(line);
			if (matchResult) {
				this.onQuitMember(matchResult[1]);
				return;
			}
			matchResult = this.successLoginMessageRegex.exec(line);
			if (matchResult) {
				this.onSuccessLoginMessage();
				return;
			}
			matchResult = this.failedLoginMessageRegex.exec(line);
			if (matchResult) {
				this.onFailedLoginMessage();
				return;
			}
		});
	}

	onSuccessLoginMessage() {
		console.log('[irc] onSuccessLoginMessage -> '.yellow);
		if (this.loginCb) {
			this.loginCb(null, this.loginReq);
		}
	}

	onFailedLoginMessage() {
		console.log('[irc] onFailedLoginMessage -> '.yellow);
		this.loginReq.allowed = false;
		this.disconnect();
		if (this.loginCb) {
			this.loginCb(null, this.loginReq);
		}
	}

	onReceiveMessage(source, target, content) {
		const now = new Date;
		const timestamp = now.getTime();
		let cacheKey = [source, target, content].join(',');
		console.log('[irc] ircSendMessageCache.get -> '.yellow, 'key:', cacheKey, 'value:', ircSendMessageCache.get(cacheKey), 'ts:', timestamp - 1000);
		if (ircSendMessageCache.get(cacheKey) > (timestamp - 1000)) {
			return;
		} else {
			ircSendMessageCache.set(cacheKey, timestamp);
		}
		console.log('[irc] onReceiveMessage -> '.yellow, 'source:', source, 'target:', target, 'content:', content);
		source = this.createUserWhenNotExist(source);
		let room;
		if (target[0] === '#') {
			room = RocketChat.models.Rooms.findOneByName(target.substring(1));
		} else {
			room = this.createDirectRoomWhenNotExist(source, this.user);
		}
		const message = { msg: content, ts: now };
		cacheKey = `${ source.username }${ timestamp }`;
		ircReceiveMessageCache.set(cacheKey, true);
		console.log('[irc] ircReceiveMessageCache.set -> '.yellow, 'key:', cacheKey);
		RocketChat.sendMessage(source, message, room);
	}

	onReceiveMemberList(roomName, members) {
		this.receiveMemberListBuf[roomName] = this.receiveMemberListBuf[roomName].concat(members);
	}

	onEndMemberList(roomName) {
		const newMembers = this.receiveMemberListBuf[roomName];
		console.log('[irc] onEndMemberList -> '.yellow, 'room:', roomName, 'members:', newMembers.join(','));
		const room = RocketChat.models.Rooms.findOneByNameAndType(roomName, 'c');
		if (!room) {
			return;
		}
		const oldMembers = room.usernames;
		const appendMembers = _.difference(newMembers, oldMembers);
		const removeMembers = _.difference(oldMembers, newMembers);
		appendMembers.forEach(member => this.createUserWhenNotExist(member));
		RocketChat.models.Rooms.removeUsernamesById(room._id, removeMembers);
		RocketChat.models.Rooms.addUsernamesById(room._id, appendMembers);

		this.isJoiningRoom = false;
		roomName = this.pendingJoinRoomBuf.shift();
		if (roomName) {
			this.joinRoom({
				t: 'c',
				name: roomName
			});
		}
	}

	sendRawMessage(msg) {
		console.log('[irc] sendRawMessage -> '.yellow, msg.slice(0, -2));
		if (this.isConnected) {
			this.socket.write(msg);
		} else {
			this.msgBuf.push(msg);
		}
	}

	sendMessage(room, message) {
		console.log('[irc] sendMessage -> '.yellow, 'userName:', message.u.username);
		let target = '';
		if (room.t === 'c') {
			target = `#${ room.name }`;
		} else if (room.t === 'd') {
			const usernames = room.usernames;
			usernames.forEach(name => {
				if (message.u.username !== name) {
					target = name;
					return;
				}
			});
		}
		const cacheKey = [this.user.username, target, message.msg].join(',');
		console.log('[irc] ircSendMessageCache.set -> '.yellow, 'key:', cacheKey, 'ts:', message.ts.getTime());
		ircSendMessageCache.set(cacheKey, message.ts.getTime());
		const msg = `PRIVMSG ${ target } :${ message.msg }\r\n`;
		this.sendRawMessage(msg);
	}

	initRoomList() {
		const roomsCursor = RocketChat.models.Rooms.findByTypeContainingUsername('c', this.user.username, { fields: { name: 1, t: 1 }});
		const rooms = roomsCursor.fetch();
		rooms.forEach(room => this.joinRoom(room));
	}

	joinRoom(room) {
		if (room.t !== 'c' || room.name === 'general') {
			return;
		}
		if (this.isJoiningRoom) {
			return this.pendingJoinRoomBuf.push(room.name);
		}
		console.log('[irc] joinRoom -> '.yellow, 'roomName:', room.name, 'pendingJoinRoomBuf:', this.pendingJoinRoomBuf.join(','));
		const msg = `JOIN #${ room.name }\r\n`;
		this.receiveMemberListBuf[room.name] = [];
		this.sendRawMessage(msg);
		this.isJoiningRoom = true;
	}

	leaveRoom(room) {
		if (room.t !== 'c') {
			return;
		}
		const msg = `PART #${ room.name }\r\n`;
		this.sendRawMessage(msg);
	}

	getMemberList(room) {
		if (room.t !== 'c') {
			return;
		}
		const msg = `NAMES #${ room.name }\r\n`;
		this.receiveMemberListBuf[room.name] = [];
		this.sendRawMessage(msg);
	}

	onAddMemberToRoom(member, roomName) {
		if (this.user.username === member) {
			return;
		}
		console.log('[irc] onAddMemberToRoom -> '.yellow, 'roomName:', roomName, 'member:', member);
		this.createUserWhenNotExist(member);
		RocketChat.models.Rooms.addUsernameByName(roomName, member);
	}

	onRemoveMemberFromRoom(member, roomName) {
		console.log('[irc] onRemoveMemberFromRoom -> '.yellow, 'roomName:', roomName, 'member:', member);
		RocketChat.models.Rooms.removeUsernameByName(roomName, member);
	}

	onQuitMember(member) {
		console.log('[irc] onQuitMember ->'.yellow, 'username:', member);
		RocketChat.models.Rooms.removeUsernameFromAll(member);
		Meteor.users.update({ name: member }, { $set: { status: 'offline' }});
	}

	createUserWhenNotExist(name) {
		const user = Meteor.users.findOne({ name });
		if (user) {
			return user;
		}
		console.log('[irc] createNotExistUser ->'.yellow, 'userName:', name);
		Meteor.call('registerUser', {
			email: `${ name }@rocketchat.org`,
			pass: 'rocketchat',
			name
		});
		Meteor.users.update({ name }, {
			$set: {
				status: 'online',
				username: name
			}
		});
		return Meteor.users.findOne({ name });
	}

	createDirectRoomWhenNotExist(source, target) {
		console.log('[irc] createDirectRoomWhenNotExist -> '.yellow, 'source:', source, 'target:', target);
		const rid = [source._id, target._id].sort().join('');
		const now = new Date();
		RocketChat.models.Rooms.upsert({ _id: rid}, {
			$set: {
				usernames: [source.username, target.username]
			},
			$setOnInsert: {
				t: 'd',
				msgs: 0,
				ts: now
			}
		});
		RocketChat.models.Subscriptions.upsert({ rid, $and: [{ 'u._id': target._id}]}, {
			$setOnInsert: {
				name: source.username,
				t: 'd',
				open: false,
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				u: { _id: target._id, username: target.username }}
		});
		return { t: 'd', _id: rid };
	}
}

IrcClient.getByUid = function(uid) {
	return ircClientMap[uid];
};

IrcClient.create = function(login) {
	if (login.user == null) {
		return login;
	}
	if (!(login.user._id in ircClientMap)) {
		const ircClient = new IrcClient(login);
		return async(ircClient.connect);
	}
	return login;
};

function IrcLoginer(login) {
	console.log('[irc] validateLogin -> '.yellow, login);
	return IrcClient.create(login);
}


function IrcSender(message) {
	const name = message.u.username;
	const timestamp = message.ts.getTime();
	const cacheKey = `${ name }${ timestamp }`;
	if (ircReceiveMessageCache.get(cacheKey)) {
		return message;
	}
	const room = RocketChat.models.Rooms.findOneById(message.rid, { fields: { name: 1, usernames: 1, t: 1 }});
	const ircClient = IrcClient.getByUid(message.u._id);
	ircClient.sendMessage(room, message);
	return message;
}


function IrcRoomJoiner(user, room) {
	const ircClient = IrcClient.getByUid(user._id);
	ircClient.joinRoom(room);
	return room;
}


function IrcRoomLeaver(user, room) {
	const ircClient = IrcClient.getByUid(user._id);
	ircClient.leaveRoom(room);
	return room;
}

function IrcLogoutCleanUper(user) {
	const ircClient = IrcClient.getByUid(user._id);
	ircClient.disconnect();
	return user;
}

//////
// Make magic happen

// Only proceed if the package has been enabled
if (IRC_AVAILABILITY === true) {
	RocketChat.callbacks.add('beforeValidateLogin', IrcLoginer, RocketChat.callbacks.priority.LOW, 'irc-loginer');
	RocketChat.callbacks.add('beforeSaveMessage', IrcSender, RocketChat.callbacks.priority.LOW, 'irc-sender');
	RocketChat.callbacks.add('beforeJoinRoom', IrcRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-room-joiner');
	RocketChat.callbacks.add('beforeCreateChannel', IrcRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-room-joiner-create-channel');
	RocketChat.callbacks.add('beforeLeaveRoom', IrcRoomLeaver, RocketChat.callbacks.priority.LOW, 'irc-room-leaver');
	RocketChat.callbacks.add('afterLogoutCleanUp', IrcLogoutCleanUper, RocketChat.callbacks.priority.LOW, 'irc-clean-up');
}
