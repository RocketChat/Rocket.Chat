@connections = {}
@startStreamBroadcast = (streams) ->
	console.log 'startStreamBroadcast'

	# connections = {}

	InstanceStatus.getCollection().find().observe
		added: (record) ->
			if record.extraInformation.port is process.env.PORT
				return

			console.log 'connecting in', "localhost:#{record.extraInformation.port}"
			connections[record.extraInformation.port] = DDP.connect("localhost:#{record.extraInformation.port}", {_dontPrintErrors: true})

		removed: (record) ->
			if connections[record.extraInformation.port]?
				console.log 'disconnecting from', "localhost:#{record.extraInformation.port}"
				connections[record.extraInformation.port].disconnect()
				delete connections[record.extraInformation.port]

	broadcast = (streamName, eventName, args, userId) ->
		for port, connection of connections
			if connection.status().connected is true
				connection.call 'stream', streamName, eventName, args

	emitters = {}

	for streamName, stream of streams
		do (streamName, stream) ->
			emitters[streamName] = stream.emit
			stream.emit = (eventName, args...) ->
				broadcast streamName, eventName, args
				emitters[streamName].call {}, arguments

	Meteor.methods
		stream: (streamName, eventName, args) ->
			args.unshift eventName
			emitters[streamName]?.apply {}, args


Meteor.startup ->
	startStreamBroadcast
		'webrtc.stream': webrtc.stream
