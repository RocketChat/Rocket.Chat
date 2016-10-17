# # #
# Assign values
# 

# Package availability
IRC_AVAILABILITY = RocketChat.settings.get('IRC_Enabled');

# Cache prep
net = Npm.require('net')
Lru = Npm.require('lru-cache')
MESSAGE_CACHE_SIZE = RocketChat.settings.get('IRC_Message_Cache_Size');
ircReceiveMessageCache = Lru MESSAGE_CACHE_SIZE
ircSendMessageCache = Lru MESSAGE_CACHE_SIZE

# IRC server
IRC_PORT = RocketChat.settings.get('IRC_Port');
IRC_HOST = RocketChat.settings.get('IRC_Host');

ircClientMap = {}


# # # 
# Core functionality
#

bind = (f) ->
	g = Meteor.bindEnvironment (self, args...) -> f.apply(self, args)
	(args...) -> g @, args...

async = (f, args...) ->
	Meteor.wrapAsync(f)(args...)

class IrcClient
	constructor: (@loginReq) ->
		@user = @loginReq.user
		ircClientMap[@user._id] = this
		@ircPort = IRC_PORT
		@ircHost = IRC_HOST
		@msgBuf = []

		@isConnected = false
		@isDistroyed = false
		@socket = new net.Socket
		@socket.setNoDelay
		@socket.setEncoding 'utf-8'
		@socket.setKeepAlive true
		@onConnect = bind @onConnect
		@onClose = bind @onClose
		@onTimeout = bind @onTimeout
		@onError = bind @onError
		@onReceiveRawMessage = bind @onReceiveRawMessage
		@socket.on 'data', @onReceiveRawMessage
		@socket.on 'close', @onClose
		@socket.on 'timeout', @onTimeout
		@socket.on 'error', @onError

		@isJoiningRoom = false
		@receiveMemberListBuf = {}
		@pendingJoinRoomBuf = []

		@successLoginMessageRegex = /RocketChat.settings.get('IRC_RegEx_successLogin');/
		@failedLoginMessageRegex = /RocketChat.settings.get('IRC_RegEx_failedLogin');/
		@receiveMessageRegex = /RocketChat.settings.get('IRC_RegEx_receiveMessage');/
		@receiveMemberListRegex = /RocketChat.settings.get('IRC_RegEx_receiveMemberList');/
		@endMemberListRegex = /RocketChat.settings.get('IRC_RegEx_endMemberList');/
		@addMemberToRoomRegex = /RocketChat.settings.get('IRC_RegEx_addMemberToRoom');/
		@removeMemberFromRoomRegex = /RocketChat.settings.get('IRC_RegEx_removeMemberFromRoom');/
		@quitMemberRegex = /RocketChat.settings.get('IRC_RegEx_quitMember');/

	connect: (@loginCb) =>
		@socket.connect @ircPort, @ircHost, @onConnect
		@initRoomList()

	disconnect: () ->
		@isDistroyed = true
		@socket.destroy()

	onConnect: () =>
		console.log '[irc] onConnect -> '.yellow, @user.username, 'connect success.'
		@socket.write "NICK #{@user.username}\r\n"
		@socket.write "USER #{@user.username} 0 * :#{@user.name}\r\n"
		# message order could not make sure here
		@isConnected = true
		@socket.write msg for msg in @msgBuf

	onClose: (data) =>
		console.log '[irc] onClose -> '.yellow, @user.username, 'connection close.'
		@isConnected = false
		if @isDistroyed
			delete ircClientMap[@user._id]
		else
			@connect()

	onTimeout: () =>
		console.log '[irc] onTimeout -> '.yellow, @user.username, 'connection timeout.', arguments

	onError: () =>
		console.log '[irc] onError -> '.yellow, @user.username, 'connection error.', arguments

	onReceiveRawMessage: (data) =>
		data = data.toString().split('\n')
		for line in data
			line = line.trim()
			console.log "[#{@ircHost}:#{@ircPort}]:", line
			# Send heartbeat package to irc server
			if line.indexOf('PING') == 0
				@socket.write line.replace('PING :', 'PONG ')
				continue

			matchResult = @receiveMessageRegex.exec line
			if matchResult
				@onReceiveMessage matchResult[1], matchResult[2], matchResult[3]
				continue

			matchResult = @receiveMemberListRegex.exec line
			if matchResult
				@onReceiveMemberList matchResult[1], matchResult[2].split ' '
				continue

			matchResult = @endMemberListRegex.exec line
			if matchResult
				@onEndMemberList matchResult[1]
				continue

			matchResult = @addMemberToRoomRegex.exec line
			if matchResult
				@onAddMemberToRoom matchResult[1], matchResult[2]
				continue

			matchResult = @removeMemberFromRoomRegex.exec line
			if matchResult
				@onRemoveMemberFromRoom matchResult[1], matchResult[2]
				continue

			matchResult = @quitMemberRegex.exec line
			if matchResult
				@onQuitMember matchResult[1]
				continue

			matchResult = @successLoginMessageRegex.exec line
			if matchResult
				@onSuccessLoginMessage()
				continue

			matchResult = @failedLoginMessageRegex.exec line
			if matchResult
				@onFailedLoginMessage()
				continue

	onSuccessLoginMessage: () ->
		console.log '[irc] onSuccessLoginMessage -> '.yellow
		if @loginCb
			@loginCb null, @loginReq

	onFailedLoginMessage: () ->
		console.log '[irc] onFailedLoginMessage -> '.yellow
		@loginReq.allowed = false
		@disconnect()
		if @loginCb
			@loginCb null, @loginReq

	onReceiveMessage: (source, target, content) ->
		now = new Date
		timestamp = now.getTime()

		cacheKey = [source, target, content].join ','
		console.log '[irc] ircSendMessageCache.get -> '.yellow, 'key:', cacheKey, 'value:', ircSendMessageCache.get(cacheKey), 'ts:', (timestamp - 1000)
		if ircSendMessageCache.get(cacheKey) > (timestamp - 1000)
			return
		else
			ircSendMessageCache.set cacheKey, timestamp

		console.log '[irc] onReceiveMessage -> '.yellow, 'source:', source, 'target:', target, 'content:', content
		source = @createUserWhenNotExist source
		if target[0] == '#'
			room = RocketChat.models.Rooms.findOneByName target.substring(1)
		else
			room = @createDirectRoomWhenNotExist(source, @user)

		message =
			msg: content
			ts: now
		cacheKey = "#{source.username}#{timestamp}"
		ircReceiveMessageCache.set cacheKey, true
		console.log '[irc] ircReceiveMessageCache.set -> '.yellow, 'key:', cacheKey
		RocketChat.sendMessage source, message, room

	onReceiveMemberList: (roomName, members) ->
		@receiveMemberListBuf[roomName] = @receiveMemberListBuf[roomName].concat members

	onEndMemberList: (roomName) ->
		newMembers = @receiveMemberListBuf[roomName]
		console.log '[irc] onEndMemberList -> '.yellow, 'room:', roomName, 'members:', newMembers.join ','
		room = RocketChat.models.Rooms.findOneByNameAndType roomName, 'c'
		unless room
			return

		oldMembers = room.usernames
		appendMembers = _.difference newMembers, oldMembers
		removeMembers = _.difference oldMembers, newMembers

		for member in appendMembers
			@createUserWhenNotExist member

		RocketChat.models.Rooms.removeUsernamesById room._id, removeMembers
		RocketChat.models.Rooms.addUsernamesById room._id, appendMembers

		@isJoiningRoom = false
		roomName = @pendingJoinRoomBuf.shift()
		if roomName
			@joinRoom
				t: 'c'
				name: roomName

	sendRawMessage: (msg) ->
		console.log '[irc] sendRawMessage -> '.yellow, msg.slice(0, -2)
		if @isConnected
			@socket.write msg
		else
			@msgBuf.push msg

	sendMessage: (room, message) ->
		console.log '[irc] sendMessage -> '.yellow, 'userName:', message.u.username
		target = ''
		if room.t == 'c'
			target = "##{room.name}"
		else if room.t == 'd'
			for name in room.usernames
				if message.u.username != name
					target = name
					break

		cacheKey = [@user.username, target, message.msg].join ','
		console.log '[irc] ircSendMessageCache.set -> '.yellow, 'key:', cacheKey, 'ts:', message.ts.getTime()
		ircSendMessageCache.set cacheKey, message.ts.getTime()
		msg = "PRIVMSG #{target} :#{message.msg}\r\n"
		@sendRawMessage msg

	initRoomList: ->
		roomsCursor = RocketChat.models.Rooms.findByTypeContainigUsername 'c', @user.username,
			fields:
				name: 1
				t: 1

		rooms = roomsCursor.fetch()
		for room in rooms
			@joinRoom(room)

	joinRoom: (room) ->
		if room.t isnt 'c' or room.name == 'general'
			return

		if @isJoiningRoom
			@pendingJoinRoomBuf.push room.name
		else
			console.log '[irc] joinRoom -> '.yellow, 'roomName:', room.name, 'pendingJoinRoomBuf:', @pendingJoinRoomBuf.join ','
			msg = "JOIN ##{room.name}\r\n"
			@receiveMemberListBuf[room.name] = []
			@sendRawMessage msg
			@isJoiningRoom = true

	leaveRoom: (room) ->
		if room.t isnt 'c'
			return
		msg = "PART ##{room.name}\r\n"
		@sendRawMessage msg

	getMemberList: (room) ->
		if room.t isnt 'c'
			return
		msg = "NAMES ##{room.name}\r\n"
		@receiveMemberListBuf[room.name] = []
		@sendRawMessage msg

	onAddMemberToRoom: (member, roomName) ->
		if @user.username == member
			return

		console.log '[irc] onAddMemberToRoom -> '.yellow, 'roomName:', roomName, 'member:', member
		@createUserWhenNotExist member

		RocketChat.models.Rooms.addUsernameByName roomName, member

	onRemoveMemberFromRoom: (member, roomName)->
		console.log '[irc] onRemoveMemberFromRoom -> '.yellow, 'roomName:', roomName, 'member:', member
		RocketChat.models.Rooms.removeUsernameByName roomName, member

	onQuitMember: (member) ->
		console.log '[irc] onQuitMember ->'.yellow, 'username:', member
		RocketChat.models.Rooms.removeUsernameFromAll member

		Meteor.users.update {name: member},
			$set:
				status: 'offline'

	createUserWhenNotExist: (name) ->
		user = Meteor.users.findOne {name: name}
		unless user
			console.log '[irc] createNotExistUser ->'.yellow, 'userName:', name
			Meteor.call 'registerUser',
				email: "#{name}@rocketchat.org"
				pass: 'rocketchat'
				name: name
			Meteor.users.update {name: name},
				$set:
					status: 'online'
					username: name
			user = Meteor.users.findOne {name: name}
		return user


	createDirectRoomWhenNotExist: (source, target) ->
		console.log '[irc] createDirectRoomWhenNotExist -> '.yellow, 'source:', source, 'target:', target
		rid = [source._id, target._id].sort().join('')
		now = new Date()
		RocketChat.models.Rooms.upsert
			_id: rid
		,
			$set:
				usernames: [source.username, target.username]
			$setOnInsert:
				t: 'd'
				msgs: 0
				ts: now

		RocketChat.models.Subscriptions.upsert
			rid: rid
			$and: [{'u._id': target._id}]
		,
			$setOnInsert:
				name: source.username
				t: 'd'
				open: false
				alert: false
				unread: 0
				u:
					_id: target._id
					username: target.username
		return {
			t: 'd'
			_id: rid
		}

IrcClient.getByUid = (uid) ->
	return ircClientMap[uid]

IrcClient.create = (login) ->
	unless login.user?
		return login
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
		name = message.u.username
		timestamp = message.ts.getTime()
		cacheKey = "#{name}#{timestamp}"
		if ircReceiveMessageCache.get cacheKey
			return message

		room = RocketChat.models.Rooms.findOneById message.rid, { fields: { name: 1, usernames: 1, t: 1 } }
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


class IrcLogoutCleanUper
	constructor: (user) ->
		ircClient = IrcClient.getByUid user._id
		ircClient.disconnect()
		return user


# # #
# Make magic happen 
#

# Only proceed if the package has been enabled
if IRC_AVAILABILITY == true
	RocketChat.callbacks.add 'beforeValidateLogin', IrcLoginer, RocketChat.callbacks.priority.LOW, 'irc-loginer'
	RocketChat.callbacks.add 'beforeSaveMessage', IrcSender, RocketChat.callbacks.priority.LOW, 'irc-sender'
	RocketChat.callbacks.add 'beforeJoinRoom', IrcRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-room-joiner'
	RocketChat.callbacks.add 'beforeCreateChannel', IrcRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-room-joiner-create-channel'
	RocketChat.callbacks.add 'beforeLeaveRoom', IrcRoomLeaver, RocketChat.callbacks.priority.LOW, 'irc-room-leaver'
	RocketChat.callbacks.add 'afterLogoutCleanUp', IrcLogoutCleanUper, RocketChat.callbacks.priority.LOW, 'irc-clean-up'
else
	return
