RocketChat.sendMessage = (user, message, room, options) ->

	if not user or not message or not room._id
		return false

	unless message.ts?
		message.ts = new Date()

	message.u = _.pick user, ['_id','username']

	message.rid = room._id

	if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?#?([\w]+)?)?/g
		message.urls = urls.map (url) -> url: url

	message = RocketChat.callbacks.run 'beforeSaveMessage', message

	if message._id? and options?.upsert is true
		ChatMessage.upsert {_id: message._id}, message
	else
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
	Update all the room activity tracker fields
	###
	Meteor.defer ->

		ChatRoom.update
			# only subscriptions to the same room
			_id: message.rid
		,
			# update the last message timestamp
			$set:
				lm: message.ts
			# increment the messages counter
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

			userOfMention = Meteor.users.findOne({_id: message.rid.replace(message.u._id, '')}, {fields: {username: 1, statusConnection: 1}})
			if userOfMention?
				RocketChat.Notifications.notifyUser userOfMention._id, 'notification',
					title: "@#{user.username}"
					text: message.msg
					payload:
						rid: message.rid
						sender: message.u
						type: room.t
						name: room.name

				if Push.enabled is true and userOfMention.statusConnection isnt 'online'
					Push.send
						from: 'push'
						title: "@#{user.username}"
						text: message.msg
						apn:
							text: "@#{user.username}:\n#{message.msg}"
						badge: 1
						sound: 'chime'
						payload:
							rid: message.rid
							sender: message.u
							type: room.t
							name: room.name
						query:
							userId: userOfMention._id

		else
			mentionIds = []
			message.mentions?.forEach (mention) ->
				mentionIds.push mention._id

			if mentionIds.length > 0
				usersOfMention = Meteor.users.find({_id: {$in: mentionIds}}, {fields: {_id: 1, username: 1}}).fetch()

				if room.t is 'c' and mentionIds.indexOf('all') is -1
					for usersOfMentionItem in usersOfMention
						if room.usernames.indexOf(usersOfMentionItem.username) is -1
							Meteor.runAsUser usersOfMentionItem._id, ->
								Meteor.call 'joinRoom', room._id

				###
				Update all other subscriptions of mentioned users to alert their owners and incrementing
				the unread counter for mentions and direct messages
				###
				query =
					# only subscriptions to the same room
					rid: message.rid

				if mentionIds.indexOf('all') > -1
					# all users except sender if mention is for all
					query['u._id'] = $ne: user._id
				else
					# the mentioned user if mention isn't for all
					query['u._id'] = $in: mentionIds

				ChatSubscription.update query,
					$set:
						# alert de user
						alert: true
						# open the room for the user
						open: true
					# increment unread couter
					$inc:
						unread: 1
				,
					multi: true

				query =
					statusConnection: {$ne: 'online'}

				if mentionIds.indexOf('all') > -1
					if room.usernames?.length > 0
						query.username =
							$in: room.usernames
					else
						query.username =
							$in: []
				else
					query._id =
						$in: mentionIds

				usersOfMentionIds = _.pluck(usersOfMention, '_id');
				if usersOfMentionIds.length > 0
					for usersOfMentionId in usersOfMentionIds
						RocketChat.Notifications.notifyUser usersOfMentionId, 'notification',
							title: "@#{user.username} @ ##{room.name}"
							text: message.msg
							payload:
								rid: message.rid
								sender: message.u
								type: room.t
								name: room.name

					if Push.enabled is true
						Push.send
							from: 'push'
							title: "@#{user.username} @ ##{room.name}"
							text: message.msg
							apn:
								text: "@#{user.username} @ ##{room.name}:\n#{message.msg}"
							badge: 1
							sound: 'chime'
							payload:
								rid: message.rid
								sender: message.u
								type: room.t
								name: room.name
							query:
								userId: $in: usersOfMentionIds

		###
		Update all other subscriptions to alert their owners but witout incrementing
		the unread counter, as it is only for mentions and direct messages
		###
		ChatSubscription.update
			# only subscriptions to the same room
			rid: message.rid
			# only the ones that have not been alerted yet
			alert: { $ne: true }
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
