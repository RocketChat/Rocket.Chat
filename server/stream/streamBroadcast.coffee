logger = new Logger 'StreamBroadcast',
	sections:
		connection: 'Connection'
		auth: 'Auth'
		stream: 'Stream'

_authorizeConnection = (instance) ->
	logger.auth.info "Authorizing with #{instance}"

	connections[instance].call 'broadcastAuth', connections[instance].instanceRecord._id, InstanceStatus.id(), (err, ok) ->
		if err?
			return logger.auth.error "broadcastAuth error #{instance} #{connections[instance].instanceRecord._id} #{InstanceStatus.id()}", err

		connections[instance].broadcastAuth = ok
		logger.auth.info "broadcastAuth with #{instance}", ok

authorizeConnection = (instance) ->
	if not InstanceStatus.getCollection().findOne({_id: InstanceStatus.id()})?
		return Meteor.setTimeout ->
			authorizeConnection(instance)
		, 500

	_authorizeConnection(instance)

@connections = {}
@startStreamBroadcast = () ->
	process.env.INSTANCE_IP ?= 'localhost'

	logger.info 'startStreamBroadcast'

	InstanceStatus.getCollection().find({'extraInformation.port': {$exists: true}}, {sort: {_createdAt: -1}}).observe
		added: (record) ->
			instance = "#{record.extraInformation.host}:#{record.extraInformation.port}"

			if record.extraInformation.port is process.env.PORT and record.extraInformation.host is process.env.INSTANCE_IP
				logger.auth.info "prevent self connect", instance
				return

			if record.extraInformation.host is process.env.INSTANCE_IP
				instance = "localhost:#{record.extraInformation.port}"

			if connections[instance]?.instanceRecord?
				if connections[instance].instanceRecord._createdAt < record._createdAt
					connections[instance].disconnect()
					delete connections[instance]
				else
					return

			logger.connection.info 'connecting in', instance
			connections[instance] = DDP.connect(instance, {_dontPrintErrors: true})
			connections[instance].instanceRecord = record;
			connections[instance].onReconnect = ->
				authorizeConnection(instance)

		removed: (record) ->
			instance = "#{record.extraInformation.host}:#{record.extraInformation.port}"

			if record.extraInformation.host is process.env.INSTANCE_IP
				instance = "localhost:#{record.extraInformation.port}"

			if connections[instance]? and not InstanceStatus.getCollection().findOne({'extraInformation.host': record.extraInformation.host, 'extraInformation.port': record.extraInformation.port})?
				logger.connection.info 'disconnecting from', instance
				connections[instance].disconnect()
				delete connections[instance]

	broadcast = (streamName, eventName, args, userId) ->
		fromInstance = process.env.INSTANCE_IP + ':' + process.env.PORT
		for instance, connection of connections
			do (instance, connection) ->
				if connection.status().connected is true
					connection.call 'stream', streamName, eventName, args, (error, response) ->
						if error?
							logger.error "Stream broadcast error", error

						switch response
							when 'self-not-authorized'
								logger.stream.error "Stream broadcast from '#{fromInstance}' to '#{connection._stream.endpoint}' with name #{streamName} to self is not authorized".red
								logger.stream.debug "    -> connection authorized".red, connection.broadcastAuth
								logger.stream.debug "    -> connection status".red, connection.status()
								logger.stream.debug "    -> arguments".red, eventName, args

							when 'not-authorized'
								logger.stream.error "Stream broadcast from '#{fromInstance}' to '#{connection._stream.endpoint}' with name #{streamName} not authorized".red
								logger.stream.debug "    -> connection authorized".red, connection.broadcastAuth
								logger.stream.debug "    -> connection status".red, connection.status()
								logger.stream.debug "    -> arguments".red, eventName, args
								authorizeConnection(instance);

							when 'stream-not-exists'
								logger.stream.error "Stream broadcast from '#{fromInstance}' to '#{connection._stream.endpoint}' with name #{streamName} does not exist".red
								logger.stream.debug "    -> connection authorized".red, connection.broadcastAuth
								logger.stream.debug "    -> connection status".red, connection.status()
								logger.stream.debug "    -> arguments".red, eventName, args

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
