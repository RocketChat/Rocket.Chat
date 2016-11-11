RocketChat.sendMessage = (user, message, room, upsert = false) ->
	if not user or not message or not room._id
		return false

	unless message.ts?
		message.ts = new Date()

	message.u = _.pick user, ['_id','username']

	if not Match.test(message.msg, String)
		message.msg = ''

	message.rid = room._id

	if not room.usernames? || room.usernames.length is 0
		room = RocketChat.models.Rooms.findOneById(room._id)

	if message.parseUrls isnt false
		if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g
			message.urls = urls.map (url) -> url: url

	message = RocketChat.callbacks.run 'beforeSaveMessage', message

	# Avoid saving sandstormSessionId to the database
	sandstormSessionId = null
	if message.sandstormSessionId
		sandstormSessionId = message.sandstormSessionId
		delete message.sandstormSessionId

	if message._id? and upsert
		_id = message._id
		delete message._id
		RocketChat.models.Messages.upsert {_id: _id, 'u._id': message.u._id}, message
		message._id = _id
	else
		message._id = RocketChat.models.Messages.insert message
	HTTP.call 'POST', 'http://how.ubegin.com/user/notify', {data: message}

	###
	Defer other updates as their return is not interesting to the user
	###
	Meteor.defer ->
		# Execute all callbacks
		message.sandstormSessionId = sandstormSessionId
		RocketChat.callbacks.run 'afterSaveMessage', message, room

	return message
