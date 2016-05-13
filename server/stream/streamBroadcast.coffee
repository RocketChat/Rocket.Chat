logger = new Logger 'StreamBroadcast',
	sections:
		connection: 'Connection'
		auth: 'Auth'
		stream: 'Stream'

authorizeConnection = (connection) ->
	logger.auth.info "Authorizing with localhost:#{connection.instanceRecord.extraInformation.port}"
	connection.call 'broadcastAuth', connection.instanceRecord._id, InstanceStatus.id(), (err, ok) ->
		connection.broadcastAuth = ok
		logger.auth.info "broadcastAuth with localhost:#{connection.instanceRecord.extraInformation.port}", ok

@connections = {}
@startStreamBroadcast = () ->
	logger.info 'startStreamBroadcast'

	# connections = {}

	InstanceStatus.getCollection().find({'extraInformation.port': {$exists: true}}, {sort: {_createdAt: -1}}).observe
		added: (record) ->
			if record.extraInformation.port is process.env.PORT
				return

			if connections[record.extraInformation.port]?.instanceRecord?
				if connections[record.extraInformation.port].instanceRecord._createdAt < record._createdAt
					connections[record.extraInformation.port].disconnect()
					delete connections[record.extraInformation.port]
				else
					return

			logger.connection.info 'connecting in', "localhost:#{record.extraInformation.port}"
			connections[record.extraInformation.port] = DDP.connect("localhost:#{record.extraInformation.port}", {_dontPrintErrors: true})
			connections[record.extraInformation.port].instanceRecord = record;
			authorizeConnection(connections[record.extraInformation.port]);
			connections[record.extraInformation.port].onReconnect = ->
				authorizeConnection(connections[record.extraInformation.port]);

		removed: (record) ->
			if connections[record.extraInformation.port]? and not InstanceStatus.getCollection().findOne({'extraInformation.port': record.extraInformation.port})?
				logger.connection.info 'disconnecting from', "localhost:#{record.extraInformation.port}"
				connections[record.extraInformation.port].disconnect()
				delete connections[record.extraInformation.port]

	broadcast = (streamName, eventName, args, userId) ->
		for port, connection of connections
			do (port, connection) ->
				if connection.status().connected is true
					connection.call 'stream', streamName, eventName, args, (error, response) ->
						if error?
							logger.error "Stream broadcast error", error

						switch response
							when 'self-not-authorized'
								logger.stream.error "Stream broadcast from:#{process.env.PORT} to:#{connection._stream.endpoint} with name #{streamName} to self is not authorized".red
								logger.stream.debug "    -> connection authorized".red, connection.broadcastAuth
								logger.stream.debug "    -> connection status".red, connection.status()
								logger.stream.debug "    -> arguments".red, eventName, args

							when 'not-authorized'
								logger.stream.error "Stream broadcast from:#{process.env.PORT} to:#{connection._stream.endpoint} with name #{streamName} not authorized".red
								logger.stream.debug "    -> connection authorized".red, connection.broadcastAuth
								logger.stream.debug "    -> connection status".red, connection.status()
								logger.stream.debug "    -> arguments".red, eventName, args
								authorizeConnection(connection);

							when 'stream-not-exists'
								logger.stream.error "Stream broadcast from:#{process.env.PORT} to:#{connection._stream.endpoint} with name #{streamName} does not exist".red
								logger.stream.debug "    -> connection authorized".red, connection.broadcastAuth
								logger.stream.debug "    -> connection status".red, connection.status()
								logger.stream.debug "    -> arguments".red, eventName, args


	Meteor.methods
		showConnections: ->
			data = {}
			for port, connection of connections
				data[port] =
					status: connection.status()
					broadcastAuth: connection.broadcastAuth
			return data

	Meteor.StreamerCentral.on 'broadcast', (streamName, eventName, args) ->
		broadcast streamName, eventName, args

	Meteor.methods
		broadcastAuth: (selfId, remoteId) ->
			check selfId, String
			check remoteId, String

			@unblock()
			if selfId is InstanceStatus.id() and remoteId isnt InstanceStatus.id() and InstanceStatus.getCollection().findOne({_id: remoteId})?
				@connection.broadcastAuth = true

			return @connection.broadcastAuth is true

		stream: (streamName, eventName, args) ->
			# Prevent call from self and client
			if not @connection?
				return 'self-not-authorized'

			# Prevent call from unauthrorized connections
			if @connection.broadcastAuth isnt true
				return 'not-authorized'

			if not Meteor.StreamerCentral.instances[streamName]?
				return 'stream-not-exists'

			Meteor.StreamerCentral.instances[streamName]._emit(eventName, args)

			return undefined


Meteor.startup ->
	startStreamBroadcast()
