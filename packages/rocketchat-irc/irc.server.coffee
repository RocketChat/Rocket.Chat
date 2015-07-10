net = Npm.require('net')

ircClientMap = {}

bind = (f) ->
	g = Meteor.bindEnvironment (self, args...) -> f.apply(self, args)
	(args...) -> g @, args...

async = (f, args...) ->
	Meteor.wrapAsync(f)(args...)

class IrcClient
	constructor: (@loginReq) ->
		@user = @loginReq.user
		ircClientMap[@user._id] = this
		@ircPort = 6667
		@ircHost = 'irc.freenode.net'
		@msgBuf = []
		@isConnected = false
		@socket = new net.Socket
		@socket.setNoDelay
		@socket.setEncoding 'utf-8'
		@onConnect = bind @onConnect
		@onReceiveRawMessage = bind @onReceiveRawMessage
		@socket.on 'data', @onReceiveRawMessage
		@socket.on 'close', @onClose
		@receiveMessageRegex = /^:(\S+)!~\S+ PRIVMSG (\S+) :(.+)$/
		@memberListRegex = /^:\S+ \d+ \S+ = #(\S+) :(.*)$/
		@initRoomList()

	connect: (@loginCb) =>
		@socket.connect @ircPort, @ircHost, @onConnect

	onConnect: () =>
		console.log @user.username, 'connect success.'
		@socket.write "NICK #{@user.username}\r\n"
		@socket.write "USER #{@user.username} 0 * :Real Name\r\n"
		# message order could not make sure here
		@isConnected = true
		@socket.write msg for msg in @msgBuf
		@loginCb null, @loginReq

	onClose: (data) =>
		console.log @user.username, 'connection close.'

	onReceiveRawMessage: (data) =>
		data = data.toString().split('\n')
		for line in data
			line = line.trim()
			console.log "[#{@ircHost}:#{@ircPort}]:", line
			if line.indexOf('PING') == 0
				@socket.write line.replace('PING :', 'PONG ')
				continue

			matchResult = @receiveMessageRegex.exec line
			if matchResult
				@onReceiveMessage matchResult[1], matchResult[2], matchResult[3]
				continue

			matchResult = @memberListRegex.exec line
			if matchResult
				@onReceiveMemberList matchResult[1], matchResult[2].split ' '
				continue

	onReceiveMessage: (name, target, content) ->
		console.log '[irc] onReceiveMessage -> '.yellow, 'sourceUserName:', name, 'target:', target, 'content:', content
		if target[0] == '#'
			room = ChatRoom.findOne {name: target.substring 1}
		else
			room = ChatRoom.findOne {usernames: { $all: [target, name]}, t: 'd'}, { fields: { usernames: 1, t: 1 } }

		sourceUser = Meteor.users.findOne {username: message.u.username}, fields: username: 1
		unless sourceUser
			Meteor.call 'registerUser',
				email: '',
				password: name,
				name: name
		Meteor.call 'receiveMessage',
			u:
				username: name
			rid: room._id
			msg: content

	onReceiveMemberList: (room, members) ->
		console.log '[irc] onReceiveMemberList -> '.yellow, 'room:', room, 'members:', members

	sendRawMessage: (msg) ->
		console.log '[irc] sendRawMessage -> '.yellow, msg
		if @isConnected
			@socket.write msg
		else
			@msgBuf.push msg

	sendMessage: (room, message) ->
		console.log '[irc] sendMessage -> '.yellow, 'userName:', message.u.username, 'arguments:', arguments
		target = ''
		if room.t == 'c'
			target = "##{room.name}"
		else if room.t == 'd'
			for name in room.usernames
				if message.u.username != name
					target = name
					break
		msg = "PRIVMSG #{target} :#{message.msg}\r\n"
		@sendRawMessage msg

	initRoomList: () ->
		roomsCursor = ChatRoom.find {usernames: { $in: [@user.username]}, t: 'c'}, { fields: { name: 1 }}
		rooms = roomsCursor.fetch()
		for room in rooms
			@joinRoom(room)

	joinRoom: (room) ->
		msg = "JOIN ##{room.name}\r\n"
		@sendRawMessage msg
		msg = "NAMES ##{room.name}\r\n"
		@sendRawMessage msg

	leaveRoom: (room) ->
		msg = "PART ##{room.name}\r\n"
		@sendRawMessage msg


IrcClient.getByUid = (uid) ->
	return ircClientMap[uid]

IrcClient.create = (login) ->
	unless login.user._id of ircClientMap
		ircClient = new IrcClient login
		return async ircClient.connect
	return login


class IrcLoginer
	constructor: (login) ->
		console.log '[irc] validateLogin -> '.yellow, login
		return IrcClient.create login


class IrcSender
	constructor: (message) ->
		room = ChatRoom.findOne message.rid, { fields: { name: 1, usernames: 1, t: 1 } }
		ircClient = IrcClient.getByUid message.u._id
		ircClient.sendMessage room, message
		return message


class IrcRoomJoiner
	constructor: (user, room) ->
		ircClient = IrcClient.getByUid user._id
		ircClient.joinRoom room
		return room


class IrcRoomLeaver
	constructor: (user, room) ->
		ircClient = IrcClient.getByUid user._id
		ircClient.leaveRoom room
		return room


RocketChat.callbacks.add 'beforeValidateLogin', IrcLoginer, RocketChat.callbacks.priority.LOW
RocketChat.callbacks.add 'beforeSaveMessage', IrcSender, RocketChat.callbacks.priority.LOW
RocketChat.callbacks.add 'beforeJoinRoom', IrcRoomJoiner, RocketChat.callbacks.priority.LOW
RocketChat.callbacks.add 'beforeLeaveRoom', IrcRoomLeaver, RocketChat.callbacks.priority.LOW