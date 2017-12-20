net = Npm.require('net')

bind = (f) ->
	g = Meteor.bindEnvironment (self, args...) -> f.apply(self, args)
	(args...) -> g @, args...

class IrcServer
	constructor: () ->
		@ircPort = 6666
		@ircHost = 'localhost'
		@serverId = '777'
		@sendPassword = 'password'
		@receivePassword = 'password'
		@serverName = 'rocket.chat'
		@serverDescription = 'federated rocketchat server'

		@logCommands = true

		@ircServers = {}
		@ircUsers = {}
		@localUsersById = {}
		@localUsersByIrcId = {}
		@nextUid = parseInt('a00001', 36)

		@socket = new net.Socket
		@socket.setNoDelay
		@socket.setEncoding 'utf-8'
		@socket.setKeepAlive true
		@socket.setTimeout 90000

		@onConnect = bind @onConnect
		@onClose = bind @onClose
		@onTimeout = bind @onTimeout
		@onError = bind @onError
		@onReceiveRawMessage = bind @onReceiveRawMessage
		@socket.on 'data', @onReceiveRawMessage
		@socket.on 'close', @onClose
		@socket.on 'timeout', @onTimeout
		@socket.on 'error', @onError

		@partialMessage = ''

		@state = 'waitingforconnection'

	connect: () =>
		console.log "[irc-server] Attempting connection to IRC on #{@ircHost}:#{@ircPort}"
		@socket.connect @ircPort, @ircHost, @onConnect
		@state = 'connecting'

	disconnect: () =>
		@socket.end()
		@state = 'waitingforconnection'
		@cleanup()

	onConnect: () =>
		@writeCommand {command: 'PASS', parameters: [@sendPassword, 'TS', 6, @serverId]}
		@writeCommand {command: 'CAPAB', trailer: 'TBURST EOB ENCAP'}
		@writeCommand {command: 'SERVER', parameters: [@serverName, 1], trailer: @serverDescription}
		@state = 'awaitingpass'

	onClose: () =>
		console.log "[irc-server] Socket closed, cleaning up state"
		@state = 'waitingforconnection'
		@cleanup()

	onTimeout: () =>
		if @state == 'connected' or @state == 'bursting'
			@writeCommand {command: 'PING', trailer: @serverId}
		else
			console.log "[irc-server] Timed out waiting for password"
			@disconnect()

	onError: (error) =>
		console.log "[irc-server] Socket error: #{error.message}"

	cleanup: () =>
		@partialMessage = ''

		if @ircServers.length > 0
			@cleanupIrcServer @otherServerId

		@localUsersById = {}
		@localUsersByIrcId = {}

	burst: () =>
		RocketChat.models.Users.find( {statusConnection: 'online'}, { fields: { _id: 1, username: 1, status: 1, name: 1}}).forEach @sendUser
		RocketChat.models.Rooms.find( {}, {fields: { ts: 1, name: 1, usernames: 1, t: 1 } } ).forEach @sendRoom

		@writeCommand {command: 'EOB', prefix: @serverId}

	sendUser: (user) =>
		counterString = @nextUid.toString(36).toUpperCase()
		@nextUid = @nextUid + 1
		data = _.extend user, {nickTimestamp: @getTime(), ircUserId: "#{@serverId}#{counterString}"}
		@localUsersById[data._id] = data
		@localUsersByIrcId[data.ircUserId] = data
		@writeCommand
			prefix: @serverId
			command: 'UID'
			parameters: [user.username, 1, data.nickTimestamp, '+', user.username, @serverName, '127.0.0.1', data.ircUserId, '*']
			trailer: user.name

	sendRoom: (room) =>
		if room.t == 'd'
			return

		userIds = []
		RocketChat.models.Users.findUsersByUsernames(room.usernames, { fields: { _id: 1, statusConnection: 1 } } ).forEach (user) =>
			if user.statusConnection == 'online' then userIds.push(@localUsersById[user._id].ircUserId)

		timestamp = Math.floor(room.ts.getTime()/1000)
		nickSpace = 510 - 29 - room.name.length
		nicksPerMessage = Math.floor(nickSpace / 20)

		index = 0
		while index * nicksPerMessage < userIds.length
			@writeCommand
				prefix: @serverId
				command: 'SJOIN'
				parameters: [timestamp, '#' + room.name, '+nt']
				trailer: userIds[index*nicksPerMessage...(index+1)*nicksPerMessage].join(' ')
			index = index + 1

	joinRoom: (user, room) =>
		if @state != 'connected'
			return

		if room.t == 'd' or @localUsersById[user._id] == undefined
			return

		userId = @localUsersById[user._id].ircUserId
		timestamp = Math.floor(room.ts.getTime()/1000)

		@writeCommand
			prefix: userId
			command: 'JOIN'
			parameters: [timestamp, '#' + room.name, '+']

	loginUser: (user) =>
		if @state != 'connected'
			return

		if @localUsersById[user._id] != undefined
			return

		@sendUser user
		RocketChat.models.Rooms.findByContainigUsername(user.username, {fields: { ts: 1, name: 1, t: 1 } } ).forEach (room) => @joinRoom(user, room)

	leaveRoom: (user, room) =>
		if @state != 'connected'
			return

		if room.t == 'd' or not user._id in @localUsersById
			return

		userId = @localUsersById[user._id].ircUserId
		@writeCommand
			prefix: userId
			command: 'PART'
			parameters: ['#' + room.name]

	createRoom: (owner, room) =>
		if room.t == 'd' or @localUsersById[owner._id] == undefined
			return

		@sendRoom room



	logoutUser: (user) =>
		if @state != 'connected'
			return

		if not user._id in @localUsersById
			return

		userId = @localUsersById[user._id].ircUserId
		delete @localUsersById[user._id]
		delete @localUsersByIrcId[userId]
		@writeCommand
			prefix: userId
			command: 'PART'
			trailer: 'Signed out'

	sendMessage: (message, room) =>
		if @state != 'connected'
			return

		if @localUsersById[message.u._id] == undefined
			return

		userId = @localUsersById[message.u._id].ircUserId

		lines = message.msg.split('\n')
		for line in lines
			line = line.trimRight()
			if room.t == 'd'
				messageSpace = 510 - 30
				targetUsername = _.find(room.usernames, (username) => username != message.u.username)
				targetUser = _.find(@ircUsers, (user) => user.username == targetUsername)
				target = targetUser.ircUserId
			else
				#TODO Should only send message if there are IRC users in the room
				messageSpace = 510 - 22 - room.name.length
				target = '#' + room.name

			index = 0
			while index * messageSpace < line.length
				@writeCommand
					prefix: userId
					command: 'PRIVMSG'
					parameters: [target]
					trailer: line.substring(index*messageSpace, (index+1)*messageSpace)
				index = index + 1

	logoutIrcUser: (userId) =>
		user = @ircUsers[userId]
		Meteor.users.update {_id: user._id},
			$set:
				status: 'offline'
		RocketChat.models.Rooms.removeUsernameFromAll(user.username)
		delete @ircUsers[userId]

	cleanupIrcServer: (serverId) =>
		disconnectedIds = []
		queue = [serverId]

		while queue.length > 0
			id = queue.pop()
			disconnectedIds.push id

			queue = queue.concat @ircServers[id].proxiesServers
			delete @ircServers[id]

		_.filter(@ircUsers, (user) => user.connectedTo in disconnectedIds).forEach @logoutIrcUser

	getDirectRoom: (source, target) ->
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

	getTime: () =>
		Math.floor(Date.now()/1000)

	parseMessage: (command) =>
		result = {}
		currentIndex = 0
		if command.length == 0
			return result
		if command[0] == ':'
			split = command.indexOf(' ', currentIndex)
			result.prefix = if split == -1
				currentIndex = command.length
				command.substring(1)
			else
				temp = command.substring(currentIndex+1, split)
				currentIndex = split + 1
				temp

		if currentIndex != command.length
			split = command.indexOf(' ', currentIndex)
			result.command = if split == -1
				temp = command.substring(currentIndex)
				currentIndex = command.length
				temp
			else
				temp = command.substring(currentIndex, split)
				currentIndex = split + 1
				temp

		result.parameters = while currentIndex != command.length and command[currentIndex] != ':'
			split = command.indexOf(' ', currentIndex)
			if split == -1
				temp = command.substring(currentIndex)
				currentIndex = command.length
				temp
			else
				temp = command.substring(currentIndex, split)
				currentIndex = split + 1
				temp


		if (currentIndex != command.length)
			result.trailer = command.substring(currentIndex + 1)

		result

	writeCommand: (command) =>
		buffer = if command.prefix? then ":#{command.prefix} " else ''
		buffer += command.command
		if command.parameters? and command.parameters.length > 0
			buffer += ' ' + command.parameters.join(' ')
		if command.trailer?
			buffer += ' :' + command.trailer

		if @logCommands
			console.log "[irc-server] Sending Command: #{buffer}"
		@socket.write(buffer + "\r\n")

	handleMalformed: (command) =>
		console.log "[irc-server] Received invalid command: #{command}"

	onReceiveRawMessage: (data) =>
		dataString = data.toString()
		lines = dataString.split('\r\n')

		newPartialMessage = ''
		if dataString.substr(dataString.length - 2) != "\n"
			newPartialMessage = lines.pop()

		firstLine = true

		for line in lines
			line = line.trim()
			if firstLine
				line = @partialMessage + line
				firstLine = false
			if @logCommands
				console.log "[irc-server] Received command: #{line}"
			command = @parseMessage line
			if not command.command?
				continue

			switch @state
				when 'awaitingpass'
					if command.command == 'PASS'
						@onReceivePASS command
				when 'bursting'
					switch command.command
						when 'CAPAB'
							@onReceiveCAPAB command
						when 'SERVER'
							@onReceiveSERVER command
						when 'SVINFO'
							@onReceiveSVINFO command
						when 'UID'
							@onReceiveUID command
						when 'SID'
							@onReceiveSID command
						when 'SJOIN'
							@onReceiveSJOIN command
						when 'PING'
							@onReceivePING command
						when 'PONG'
							@onReceivePONG command
						when 'INVITE'
							@onReceiveINVITE command
						when 'KICK'
							@onReceiveKICK command
				when 'connected'
					switch command.command
						when 'PING'
							@onReceivePING command
						when 'PONG'
							@onReceivePONG command
						when 'EOB'
							@onReceiveEOB command
						when 'UID'
							@onReceiveUID command
						when 'SID'
							@onReceiveSID command
						when 'SJOIN'
							@onReceiveSJOIN command
						when 'SQUIT'
							@onReceiveSQUIT command
						when 'JOIN'
							@onReceiveJOIN command
						when 'PART'
							@onReceivePART command
						when 'QUIT'
							@onReceiveQUIT command
						when 'INVITE'
							@onReceiveINVITE command
						when 'KICK'
							@onReceiveKICK command
						when 'PRIVMSG'
							@onReceivePRIVMSG command

		@partialMessage = newPartialMessage

	onReceivePASS: (command) =>
		if command.parameters.length != 4
			@handleMalformed(command)
			@disconnect()
			return

		[password, protocol, protocolVersion, @otherServerId] = command.parameters
		if password != @receivePassword
			@disconnect()
			return
		if protocol != 'TS' or protocolVersion != '6'
			@disconnect()
			return

		@ircServers[@otherServerId] = {proxiesServers: []}
		@state = 'bursting'

	onReceiveCAPAB: (command) =>
		@otherServerCapabilities = command.trailer.split(' ')

	onReceiveSERVER: (command) =>
		if command.parameters.length != 2 or not command.trailer?
			@handleMalformed(command)
			@disconnect()
			return
		[serverName, hopCount] = command.parameters
		@otherServerName = serverName
		@ircServers[@otherServerId].serverName = serverName

	onReceiveSVINFO: (command) =>
		if command.parameters.length != 3 or not command.trailer?
			@handleMalformed(command)
			@disconnect()
			return
		[minTS, maxTS, discard] = command.parameters
		timestamp = command.trailer
		if minTS > 6 or maxTS < 6
			@disconnect()
			return

		console.log "[irc-server] Successfully connected to IRC server, starting to burst"
		@writeCommand {prefix: @serverId, command: 'SVINFO', parameters: [6, 6, 0], trailer: @getTime()}
		@burst()
		console.log "[irc-server] Finished bursting"
		@state = 'connected'

	onReceiveSID: (command) =>
		if command.parameters.length != 3 or not command.trailer? or not command.prefix?
			@handleMalformed(command)
			return

		[serverName, hopCount, serverId] = command.parameters
		connectedTo = command.prefix
		serverDescription = command.trailer

		@ircServers[serverId] = {serverName: serverName, proxiesServers: []}
		@ircServers[connectedTo].proxiesServers.push(serverId)

		console.log "[irc-server] New server connected: #{serverName} via #{@ircServers[connectedTo].serverName}"

	onReceiveSJOIN: (command) =>
		if command.parameters.length != 3 or not command.trailer?
			@handleMalformed(command)
			return

		[channelTimestamp, channel, mode] = command.parameters
		userIds = command.trailer.split(' ')
		users = _.map(userIds, (id) =>
			{
				username: @ircUsers[id.substring(id.length-9)].username,
				isOperator: id[0] == '@'
			}

		)
		room = RocketChat.models.Rooms.findOneByName channel.substring(1)
		if not room?
			firstOperator = _.find(users, (user) => user.isOperator)
			if not firstOperator?
				return
			RocketChat.createRoom('c', channel.substring(1), firstOperator.username, [], false)
			room = RocketChat.models.Rooms.findOneByName channel.substring(1)

		RocketChat.models.Rooms.addUsernamesById(room._id, _.map(users, (user) => user.username))

	onReceiveUID: (command) =>
		if command.parameters.length != 9
			@handleMalformed(command)
			return
		[nick, hopCount, nickTimestamp, umodes, username, hostname, ipAddess, userId, gecos] = command.parameters
		connectedTo = command.prefix

		#TODO Handle nick collisions
		#TODO Handle verification that irc and rocketchat users are the same
		#TODO Handle modes
		user = Meteor.users.findOne {name: nick}
		unless user
			Meteor.call 'registerUser',
				email: "#{nick}@irc.redhat.com"
				pass: ''
				name: nick
			user = Meteor.users.findOne {name: nick}
			Meteor.users.update {_id: user._id},
				$set:
					username: nick
					ircOnly: true
		Meteor.users.update {_id: user._id},
			$set:
				status: 'online'
		user.nickTimestamp = nickTimestamp
		user.connectedTo = connectedTo
		user.ircUserId = userId
		@ircUsers[userId] = user
		console.log "[irc-server] Registered user #{nick} with userId #{userId}"



	onReceivePING: (command) =>
		source = command.trailer
		@writeCommand {prefix: @serverId, command: 'PONG', parameters: [@serverName], trailer: source}

	onReceivePONG: (command) =>
		source = command.trailer
		[sourceServerName] = command.parameters
		targetServerId = command.trailer

	onReceiveEOB: (command) =>
		serverId = command.prefix
		console.log "[irc-server] Finished receiving burst from #{@ircServers[serverId].serverName}"

	onReceiveJOIN: (command) =>
		userId = command.prefix
		[channelTimestamp, channel, ...] = command.parameters
		RocketChat.models.Rooms.addUsernameByName channel.substring(1), @ircUsers[userId].username

	onReceivePART: (command) =>
		userId = command.prefix
		[channel] = command.parameters
		RocketChat.models.Rooms.removeUsernameByName channel.substring(1), @ircUsers[userId].username

	onReceiveQUIT: (command) =>
		userId = command.prefix
		reason = command.trailer
		@logoutIrcUser userId

	onReceiveINVITE: (command) =>
		invitingUserId = command.prefix
		[invitedUserId, channel, channelTimestamp] = command.parameters


		invitingUser = @ircUsers[invitingUserId]
		if not invitingUser?
			return

		invitedUser = @localUsersByIrcId[invitedUserId]
		if not invitedUser?
			return

		room = RocketChat.models.Rooms.findOneByName channel.substring(1)
		if not room?
			return

		console.log "[irc-server] Inviting #{invitedUser.username} to #{room.name}"

		Meteor.runAsUser invitingUser._id, =>
			Meteor.call 'addUserToRoom',
				rid: room._id
				username: invitedUser.username

	onReceiveKICK: (command) =>
		kickingUserId = command.prefix
		[channel, kickedUserId] = command.parameters


		kickingUser = @ircUsers[kickingUserId]
		if not kickingUser?
			return

		kickedUser = @localUsersByIrcId[kickedUserId]
		if not kickedUser?
			return

		room = RocketChat.models.Rooms.findOneByName channel.substring(1)
		if not room?
			return

		console.log "[irc-server] Kicking #{kickedUser.username} from #{room.name}"

		Meteor.runAsUser kickingUser._id, =>
			Meteor.call 'removeUserFromRoom',
				rid: room._id
				username: kickedUser.username

	onReceiveSQUIT: (command) =>
		[targetServer] = command.parameters
		comment = command.trailer

		if targetServer == @serverId
			targetServer = @otherServerId

		console.log "[irc-server] IRC server disconnecting: #{@ircServers[targetServer].serverName}"
		@cleanupIrcServer targetServer

	onReceivePRIVMSG: (command) =>
		userId = command.prefix
		[channel] = command.parameters
		content = command.trailer

		user = @ircUsers[userId]
		if channel[0] == '#'
			room = RocketChat.models.Rooms.findOneByName channel.substring(1)
		else
			#TODO Handle direct messages
			targetUser = @localUsersByIrcId[channel]
			room = @getDirectRoom user, targetUser

		message =
			msg: content
			ts: new Date()
		RocketChat.sendMessage user, message, room


IrcServerLoginer = (login) ->
	if login.user? then ircServer.loginUser(login.user)
	return login


IrcServerSender = (message, room) ->
	ircServer.sendMessage message, room


IrcServerRoomJoiner = (user, room) ->
	ircServer.joinRoom user, room
	return room


IrcServerRoomLeaver = (user, room) ->
	ircServer.leaveRoom user, room
	return room


IrcServerLogoutCleanUper = (user) ->
	ircServer.logoutUser user
	return user

IrcServerRoomCreator = (owner, room) ->
	ircServer.createRoom owner, room

RocketChat.callbacks.add 'afterValidateLogin', IrcServerLoginer, RocketChat.callbacks.priority.LOW, 'irc-server-loginer'
RocketChat.callbacks.add 'afterSaveMessage', IrcServerSender, RocketChat.callbacks.priority.LOW, 'irc-server-sender'
RocketChat.callbacks.add 'beforeJoinRoom', IrcServerRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-server-room-joiner'
RocketChat.callbacks.add 'beforeCreateChannel', IrcServerRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-server-room-joiner-create-channel'
RocketChat.callbacks.add 'beforeLeaveRoom', IrcServerRoomLeaver, RocketChat.callbacks.priority.LOW, 'irc-server-room-leaver'
RocketChat.callbacks.add 'afterLogoutCleanUp', IrcServerLogoutCleanUper, RocketChat.callbacks.priority.LOW, 'irc-server-clean-up'
RocketChat.callbacks.add 'afterCreateRoom', IrcServerRoomCreator, RocketChat.callbacks.priority.LOW, 'irc-server-room-creator'

ircServer = new IrcServer
Meteor.startup ->
	Meteor.setTimeout( (() => ircServer.connect()), 30000 )

