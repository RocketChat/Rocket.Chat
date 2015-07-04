@typingStream = new Meteor.Stream 'typing'

typingStream.permissions.read ->
	return true

typingStream.permissions.write ->
	return true

# typingStream.stream.on 'teste', ->
# 	console.log 'teste ->', arguments

typingStream.on 'typing', (typing) ->
	typingStream.emit typing.room, _.pick(typing, 'username', 'start', 'stop')
