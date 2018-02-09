import { IrcServer } from './irc-server';

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
