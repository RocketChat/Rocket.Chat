RocketChat.sendMessage = (user, message, room) ->

	if not user or not message or not room._id
		return false

	console.log '[functions] RocketChat.sendMessage -> '.green, 'arguments:', arguments

	message.ts = new Date()

	message.u = _.pick user, ['_id','username']

	message.rid = room._id

	if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?#?([\w]+)?)?/g
		message.urls = urls.map (url) -> url: url

	message = RocketChat.callbacks.run 'beforeSaveMessage', message

	message._id = ChatMessage.insert message

	###
	Defer other updates as their return is not interesting to the user
	###

	###
	Execute all callbacks
	###
	Meteor.defer ->

		RocketChat.callbacks.run 'afterSaveMessage', message

	###
	Remove the typing record
	###
	Meteor.defer ->

		ChatMessage.remove
			rid: message.rid
			t: 't'
			'u._id': message.u._id

	###
	Update all the room activity tracker fields
	###
	Meteor.defer ->

		ChatRoom.update
			# only subscriptions to the same room
			rid: message.rid
		,
			# update the last message timestamp
			$set:
				lm: message.ts
			# increate the messages counter
			$inc:
				msgs: 1

	###
	Increment unread couter if direct messages
	###
	Meteor.defer ->

		if not room.t? or room.t is 'd'
			###
			Update the other subscriptions
			###
			ChatSubscription.update
				# only subscriptions to the same room
				rid: message.rid
				# only direct messages subscriptions
				t: 'd'
				# not the msg owner
				'u._id':
					$ne: message.u._id
			,
				$set:
					# alert de user
					alert: true
					# open the room for the user
					open: true
				# increment unread couter
				$inc:
					unread: 1

		else
			message.mentions?.forEach (mention) ->
				###
				Update all other subscriptions of mentioned users to alert their owners and incrementing
				the unread counter for mentions and direct messages
				###
				ChatSubscription.update
					# only subscriptions to the same room
					rid: message.rid
					# the mentioned user
					'u._id': mention._id
				,
					$set:
						# alert de user
						alert: true
						# open the room for the user
						open: true
					# increment unread couter
					$inc:
						unread: 1

		###
		Update all other subscriptions to alert their owners but witout incrementing
		the unread counter, as it is only for mentions and direct messages
		###
		ChatSubscription.update
			# only subscriptions to the same room
			rid: message.rid
			# only the ones that have not been alerted yet
			alert: false
			# not the msg owner
			'u._id':
				$ne: message.u._id
		,
			$set:
				# alert de user
				alert: true
				# open the room for the user
				open: true
		,
			# make sure we alert all matching subscription
			multi: true

	return message
