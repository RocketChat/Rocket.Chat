net = Npm.require('net')

MESSAGE_CACHE_SIZE = 200
IRC_PORT = 6667
IRC_HOST = 'irc.freenode.net'

ircClientMap = {}

bind = (f) ->
	g = Meteor.bindEnvironment (self, args...) -> f.apply(self, args)
	(args...) -> g @, args...

async = (f, args...) ->
	Meteor.wrapAsync(f)(args...)

class IrcServer
	constructor: () ->
		@ircPort = 6666
		@ircHost = 'localhost'
		@serverId = '777'
		@sendPassword = 'password'
		@receivePassword = 'password'
		@serverName = 'rocket.chat'
		@serverDescription = 'federated rocketchat server'
		
		@ircServers = {}
		@ircUsers = {}
		@localUsers = {}
		@nextUid = parseInt('a00001', 36)

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

		@partialMessage = ''

		@state = 'waitingforconnection'

	connect: () =>
		console.log "Connecting to IRC"
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
		#@socket.write "PASS #{@sendPassword} TS 6 #{@serverId}\r\n"
		#@socket.write "CAPAB :TBURST EOB ENCAP\r\n"
		#@socket.write "SERVER #{@serverName} 1 :#{@serverDescription}\r\n"
		@state = 'awaitingpass'

	onClose: () =>
		@state = 'waitingforconnection'
		@cleanup()

	cleanup: () =>
		@partialMessage = ''
		@ircServers = {}
		@ircUsers = {}
		@localUsers = {}

	burst: () =>
		RocketChat.models.Users.find( {statusConnection: 'online'}, { fields: { _id: 1, username: 1, status: 1, name: 1}}).forEach @sendUser
		RocketChat.models.Rooms.find( {}, {fields: { ts: 1, name: 1, usernames: 1, t: 1 } } ).forEach @sendRoom

		@writeCommand {command: 'EOB', prefix: @serverId}

	sendUser: (user) =>
		counterString = @nextUid.toString(36).toUpperCase()
		@nextUid = @nextUid + 1
		data = {nickTimestamp: @getTime(), ircUserId: "#{@serverId}#{counterString}"} 
		@localUsers[user._id] = data 
		@writeCommand (
			prefix: @serverId 
			command: 'UID'
			parameters: [user.username, 1, data.nickTimestamp, '+', user.username, @serverName, '127.0.0.1', data.ircUserId, '*']
			trailer: user.name
		)

	sendRoom: (room) =>
		if room.t == 'd'
			return

		userIds = []
		RocketChat.models.Users.findUsersByUsernames(room.usernames, { fields: { _id: 1, statusConnection: 1 } } ).forEach (user) => if user.statusConnection == 'online' then userIds.push(@localUsers[user._id].ircUserId)

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

		if room.t == 'd' or not user._id in @localUsers
			return

		userId = @localUsers[user._id].ircUserId
		timestamp = Math.floor(room.ts.getTime()/1000)
	
		@writeCommand
			prefix: userId
			command: 'JOIN'
			parameters: [timestamp, '#' + room.name, '+']	

	loginUser: (user) =>
		if @state != 'connected'
			return

		@sendUser user
		RocketChat.models.Rooms.findByContainigUsername(user.username, {fields: { ts: 1, name: 1, t: 1 } } ).forEach (room) => @joinRoom(user, room)

	leaveRoom: (user, room) =>
		if @state != 'connected'
			return

		if room.t == 'd' or not user._id in @localUsers
			return

		userId = @localUsers[user._id].ircUserId
		@writeCommand
			prefix: userId
			command: 'PART'
			parameters: ['#' + room.name]		

	logoutUser: (user) =>
		if @state != 'connected'
			return

		if not user._id in @localUsers
			return

		userId = @localUsers[user._id].ircUserId
		@writeCommand
			prefix: userId
			command: 'PART'
			trailer: 'Signed out'		

	sendMessage: (message, room) =>
		if @state != 'connected'
			return

		if @localUsers[message.u._id] == undefined
			return

		userId = @localUsers[message.u._id].ircUserId

		lines = message.msg.split('\n')
		for line in lines
			line = line.trimRight()
			if room.t == 'd'
			else
				#TODO Should only send message if there are IRC users in the room
				messageSpace = 510 - 22 - room.name.length
				index = 0
				while index * messageSpace < line.length
					@writeCommand
						prefix: userId
						command: 'PRIVMSG'
						parameters: ['#' + room.name]
						trailer: line.substring(index*messageSpace, (index+1)*messageSpace)
					index = index + 1

	loginIrcUser: (connectedTo, userId, nick, nickTimestamp, modes) =>
		#TODO Handle nick collisions
		#TODO Handle verification that irc and rocketchat users are the same
		#TODO Handle modes
		user = Meteor.users.findOne {name: nick}
		unless user
			Meteor.call 'registerUser',
				email: "#{nick}@redhat.com"
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
		@ircUsers[userId] = user
		console.log "Registered user #{nick} with userId #{userId}"

	logoutIrcUser: (userId) =>
		#TODO cleanup @ircUsers
		user = @ircUsers[userId]
		Meteor.users.update {_id: user._id},
			$set:
				status: 'offline'
		#TODO remove user from all rooms?
		RocketChat.models.Rooms.removeUsernameFromAll(user.username)

	receiveIrcMessage: (userId, channel, message) =>
		user = @ircUsers[userId]
		if channel[0] == '#'
			room = RocketChat.models.Rooms.findOneByName channel.substring(1)
		else
			#TODO Handle direct messages

		message =
			msg: message
			ts: new Date()
		RocketChat.sendMessage user, message, room


	getTime: () =>
		Math.floor(Date.now()/1000)

	parseMessage: (message) =>
		result = {}
		currentIndex = 0
		if message.length == 0
			return result
		if message[0] == ':'
			split = message.indexOf(' ', currentIndex)
			result.prefix = if split == -1
				currentIndex = message.length
				message.substring(1)
			else
				temp = message.substring(currentIndex+1, split)
				currentIndex = split + 1
				temp

		if currentIndex != message.length
			split = message.indexOf(' ', currentIndex)
			result.command = if split == -1
				temp = message.substring(currentIndex)
				currentIndex = message.length
				temp
			else
				temp = message.substring(currentIndex, split)
				currentIndex = split + 1
				temp	

		result.parameters = while currentIndex != message.length and message[currentIndex] != ':'
			split = message.indexOf(' ', currentIndex)
			if split == -1
				temp = message.substring(currentIndex)
				currentIndex = message.length
				temp
			else
				temp = message.substring(currentIndex, split)
				currentIndex = split + 1
				temp
						

		if (currentIndex != message.length)
			result.trailer = message.substring(currentIndex + 1)	

		result	

	writeCommand: (command) =>
		buffer = if command.prefix? then ":#{command.prefix} " else ''
		buffer += command.command
		if command.parameters? and command.parameters.length > 0
			buffer += ' ' + command.parameters.join(' ')
		if command.trailer?
			buffer += ' :' + command.trailer

		console.log "Sending Command: #{buffer}"
		@socket.write(buffer + "\r\n")
			
	handleMalformed: (message) =>
		console.log "Received invalid message: #{message}"

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

			console.log "Received message in state #{@state}: #{line}"
			message = @parseMessage line
			if not message.command?
				continue

			switch @state
				when 'awaitingpass'
					if message.command == 'PASS'
						if message.parameters.length != 4
							@handleMalformed(message)
							@disconnect()
							return

						[password, protocol, protocolVersion, @otherServerId] = message.parameters
						if password != @receivePassword
							@disconnect()
							return
						if protocol != 'TS' or protocolVersion != '6'
							@disconnect()
							return

						@ircServers[@otherServerId] = {proxiesServers: []}
						@state = 'bursting'
				when 'bursting'
					switch message.command
						when 'CAPAB'
							@otherServerCapabilities = message.trailer.split(' ')
						when 'SERVER'
							if message.parameters.length != 2 or not message.trailer?
								@handleMalformed(message)
								@disconnect()
								return
							[serverName, hopCount] = message.parameters
							if hopCount == '1' then @otherServerName = serverName
						when 'SVINFO'
							if message.parameters.length != 3 or not message.trailer?
								@handleMalformed(message)
								@disconnect()
								return
							[minTS, maxTS, discard] = message.parameters
							timestamp = message.trailer
							if minTS > 6 or maxTS < 6
								@disconnect()
								return

							@writeCommand {prefix: @serverId, command: 'SVINFO', parameters: [6, 6, 0], trailer: @getTime()}
							@burst()
						when 'SID'
							@onReceiveSID message
						when 'SJOIN'
							if message.parameters.length != 3 or not message.trailer?
								@handleMalformed(message)
								continue
							[channelTimestamp, channel, mode] = message.parameters
							userIds = message.trailer.split(' ')
							room = RocketChat.models.Rooms.findOneByName channel.substring(1)
							if not room?
								continue #TODO Create missing channels?
							usernames = _.map(userIds, (id) => @ircUsers[id].username)
							RocketChat.models.Rooms.addUsernamesById(room._id, usernames)
						when 'UID'
							if message.parameters.length != 9
								@handleMalformed(message)
								continue
							[nick, hopCount, nickTimestamp, umodes, username, hostname, ipAddess, userId, gecos] = message.parameters
							connectedTo = message.prefix
							@loginIrcUser connectedTo, userId, nick, nickTimestamp, umodes 
						when 'PING'
							source = message.trailer
							@writeCommand {prefix: @serverId, command: 'PONG', parameters: [@serverName], trailer: source}
							#@socket.write ":#{@serverId} PONG #{@serverName} :@{source}"
						when 'EOB'
							@state = 'connected'
				when 'connected'
					switch message.command
						when 'PING'
							source = message.trailer
							@writeCommand {prefix: @serverId, command: 'PONG', parameters: [@serverName], trailer: source}
							#@socket.write ":#{@serverId} PONG #{@serverName} :#{source}"
						when 'UID'
							if message.parameters.length != 9
								@handleMalformed(message)
								continue
							[nick, hopCount, nickTimestamp, umodes, username, hostname, ipAddess, userId, gecos] = message.parameters
							connectedTo = message.prefix
							@loginIrcUser connectedTo, userId, nick, nickTimestamp, umodes 
						when 'SID'
							@onReceiveSID message
						when 'SJOIN'
							if message.parameters.length != 3 or not message.trailer?
								@handleMalformed(message)
								return
							[channelTimestamp, channel, mode] = message.parameters
							userIds = message.trailer.split(' ')
						when 'SQUIT'
							[targetServer] = message.parameters
							comment = message.trailer
						when 'JOIN'
							userId = message.prefix
							[channelTimestamp, channel, ...] = message.parameters
							RocketChat.models.Rooms.addUsernameByName channel.substring(1), @ircUsers[userId].username
						when 'PART'
							userId = message.prefix
							[channel] = message.parameters 
							RocketChat.models.Rooms.removeUsernameByName channel.substring(1), @ircUsers[userId].username
						when 'QUIT'
							userId = message.prefix
							reason = message.trailer
							@logoutIrcUser userId
						when 'PRIVMSG'
							userId = message.prefix
							[channel] = message.parameters
							content = message.trailer
							@receiveIrcMessage userId, channel, content								

		@partialMessage = newPartialMessage

	onReceiveSID: (command) =>
		if message.parameters.length != 3 or not message.trailer? or not message.prefix?
			@handleMalformed(message)
			return

		[serverName, hopCount, serverId] = message.parameters
		connectedTo = message.prefix
		serverDescription = message.trailer

		@ircServers[serverId] = {proxiesServers: []}
		@ircServers[connectedTo].proxiesServers.push(serverId)

class IrcClient
	constructor: (@loginReq) ->
		@user = @loginReq.user
		@user.username = @user.name
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

		@successLoginMessageRegex = /Welcome to the freenode Internet Relay Chat Network/
		@failedLoginMessageRegex = /You have not registered/
		@receiveMessageRegex = /^:(\S+)!~\S+ PRIVMSG (\S+) :(.+)$/
		@receiveMemberListRegex = /^:\S+ \d+ \S+ = #(\S+) :(.*)$/
		@endMemberListRegex = /^.+#(\S+) :End of \/NAMES list.$/
		@addMemberToRoomRegex = /^:(\S+)!~\S+ JOIN #(\S+)$/
		@removeMemberFromRoomRegex = /^:(\S+)!~\S+ PART #(\S+)$/
		@quiteMemberRegex = /^:(\S+)!~\S+ QUIT .*$/

	connect: (@loginCb) =>
		@socket.connect @ircPort, @ircHost, @onConnect
		@initRoomList()

	disconnect: () ->
		@isDistroyed = true
		@socket.destroy()

	onConnect: () =>
		console.log '[irc] onConnect -> '.yellow, @user.username, 'connect success.'
		@socket.write "NICK #{@user.username}\r\n"
		@socket.write "USER #{@user.username} 0 * :Real Name\r\n"
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

			matchResult = @quiteMemberRegex.exec line
			if matchResult
				@onQuiteMember matchResult[1]
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

	onQuiteMember: (member) ->
		console.log '[irc] onQuiteMember ->'.yellow, 'username:', member
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


class IrcLoginer
	constructor: (login) ->
		if login.user? then ircServer.loginUser(login.user)
		return login


class IrcSender
	constructor: (message, room) ->
		ircServer.sendMessage message, room


class IrcRoomJoiner
	constructor: (user, room) ->
		ircServer.joinRoom user, room
		return room


class IrcRoomLeaver
	constructor: (user, room) ->
		ircServer.leaveRoom user, room
		return room


class IrcLogoutCleanUper
	constructor: (user) ->
		ircServer.logoutUser user
		return user

RocketChat.callbacks.add 'afterValidateLogin', IrcLoginer, RocketChat.callbacks.priority.LOW, 'irc-loginer'
RocketChat.callbacks.add 'afterSaveMessage', IrcSender, RocketChat.callbacks.priority.LOW, 'irc-sender'
RocketChat.callbacks.add 'beforeJoinRoom', IrcRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-room-joiner'
RocketChat.callbacks.add 'beforeCreateChannel', IrcRoomJoiner, RocketChat.callbacks.priority.LOW, 'irc-room-joiner-create-channel'
RocketChat.callbacks.add 'beforeLeaveRoom', IrcRoomLeaver, RocketChat.callbacks.priority.LOW, 'irc-room-leaver'
RocketChat.callbacks.add 'afterLogoutCleanUp', IrcLogoutCleanUper, RocketChat.callbacks.priority.LOW, 'irc-clean-up'

ircServer = new IrcServer
Meteor.startup ->
	Meteor.setTimeout( (() => ircServer.connect()), 30000 )
	
