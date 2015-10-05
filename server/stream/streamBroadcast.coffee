@connections = {}
@startStreamBroadcast = (streams) ->
	console.log 'startStreamBroadcast'

	# connections = {}

	InstanceStatus.getCollection().find({'extraInformation.port': {$exists: true}}, {sort: {_createdAt: -1}}).observe
		added: (record) ->
			if record.extraInformation.port is process.env.PORT or connections[record.extraInformation.port]?
				return

			console.log 'connecting in', "localhost:#{record.extraInformation.port}"
			connections[record.extraInformation.port] = DDP.connect("localhost:#{record.extraInformation.port}", {_dontPrintErrors: true})
			connections[record.extraInformation.port].call 'broadcastAuth', record._id, InstanceStatus.id(), (err, ok) ->
				connections[record.extraInformation.port].broadcastAuth = ok
				console.log "broadcastAuth with localhost:#{record.extraInformation.port}", ok

		removed: (record) ->
			if connections[record.extraInformation.port]? and not InstanceStatus.getCollection().findOne({'extraInformation.port': record.extraInformation.port})?
				console.log 'disconnecting from', "localhost:#{record.extraInformation.port}"
				connections[record.extraInformation.port].disconnect()
				delete connections[record.extraInformation.port]

	broadcast = (streamName, args, userId) ->
		for port, connection of connections
			if connection.status().connected is true
				console.log 'broadcast to', port, streamName, args
				connection.call 'stream', streamName, args


	Meteor.methods
		showConnections: ->
			data = {}
			for port, connection of connections
				data[port] =
					status: connection.status()
					broadcastAuth: connection.broadcastAuth
			return data

	emitters = {}

	for streamName, stream of streams
		do (streamName, stream) ->
			emitters[streamName] = stream.emitToSubscriptions
			stream.emitToSubscriptions = (args, subscriptionId, userId) ->
				if subscriptionId isnt 'broadcasted'
					broadcast streamName, args

				emitters[streamName] args, subscriptionId, userId

	Meteor.methods
		broadcastAuth: (selfId, remoteId) ->
			check selfId, String
			check remoteId, String

			@unblock()
			if selfId is InstanceStatus.id() and remoteId isnt InstanceStatus.id() and InstanceStatus.getCollection().findOne({_id: remoteId})?
				@connection.broadcastAuth = true

			return @connection.broadcastAuth is true

		stream: (streamName, args) ->
			# Prevent call from self and client
			if not @connection?
				console.log "Stream for broadcast with name #{streamName} from self is not authorized".red, @connection
				return

			# Prevent call from unauthrorized connections
			if @connection.broadcastAuth isnt true
				console.log "Stream for broadcast with name #{streamName} not authorized".red
				return

			console.log 'method stream', streamName, args
			if not emitters[streamName]?
				console.log "Stream for broadcast with name #{streamName} does not exists".red
			else
				emitters[streamName].call null, args, 'broadcasted'


Meteor.startup ->
	config =
		'RocketChat.Notifications.streamAll': RocketChat.Notifications.streamAll
		'RocketChat.Notifications.streamRoom': RocketChat.Notifications.streamRoom
		'RocketChat.Notifications.streamUser': RocketChat.Notifications.streamUser

	startStreamBroadcast config
