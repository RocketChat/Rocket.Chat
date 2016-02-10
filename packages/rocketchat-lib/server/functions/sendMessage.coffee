RocketChat.sendMessage = (user, message, room, options) ->

	if not user or not message or not room._id
		return false

	unless message.ts?
		message.ts = new Date()

	message.u = _.pick user, ['_id','username']

	message.rid = room._id

	if message.parseUrls isnt false
		if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g
			message.urls = urls.map (url) -> url: url

	message = RocketChat.callbacks.run 'beforeSaveMessage', message

	if message._id? and options?.upsert is true
		RocketChat.models.Messages.upsert {_id: message._id}, message
	else
		message._id = RocketChat.models.Messages.insert message

	###
	Defer other updates as their return is not interesting to the user
	###

	###
	Execute all callbacks
	###
	Meteor.defer ->

		RocketChat.callbacks.run 'afterSaveMessage', message, room

	###
	Update all the room activity tracker fields
	###
	Meteor.defer ->
		RocketChat.models.Rooms.incUnreadAndSetLastMessageTimestampById message.rid, 1, message.ts

	###
	Increment unread couter if direct messages
	###
	Meteor.defer ->
		alwaysNotifyDesktopUsers = _.compact(_.map(RocketChat.models.Subscriptions.findAlwaysNotifyDesktopUsersByRoomId(room._id).fetch(), (subscription) -> return subscription?.u?._id));
		dontNotifyDesktopUsers = _.compact(_.map(RocketChat.models.Subscriptions.findDontNotifyDesktopUsersByRoomId(room._id).fetch(), (subscription) -> return subscription?.u?._id));
		alwaysNotifyMobileUsers = _.compact(_.map(RocketChat.models.Subscriptions.findAlwaysNotifyMobileUsersByRoomId(room._id).fetch(), (subscription) -> return subscription?.u?._id));
		dontNotifyMobileUsers = _.compact(_.map(RocketChat.models.Subscriptions.findDontNotifyMobileUsersByRoomId(room._id).fetch(), (subscription) -> return subscription?.u?._id));

		userIdsToNotify = []
		userIdsToPushNotify = []

		if not room.t? or room.t is 'd'

			###
			Update the other subscriptions
			###
			RocketChat.models.Subscriptions.incUnreadOfDirectForRoomIdExcludingUserId message.rid, message.u._id, 1

			userOfMentionId = message.rid.replace(message.u._id, '')
			userOfMention = RocketChat.models.Users.findOne({_id: userOfMentionId}, {fields: {username: 1, statusConnection: 1}})

			if userOfMention? and (dontNotifyDesktopUsers.indexOf(userOfMentionId) is -1 || alwaysNotifyDesktopUsers.indexOf(userOfMentionId) isnt -1)
				RocketChat.Notifications.notifyUser userOfMention._id, 'notification',
					title: "@#{user.username}"
					text: message.msg
					payload:
						rid: message.rid
						sender: message.u
						type: room.t
						name: room.name

			if userOfMention? and (dontNotifyMobileUsers.indexOf(userOfMentionId) is -1 || alwaysNotifyMobileUsers.indexOf(userOfMentionId) isnt -1)
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
							host: Meteor.absoluteUrl()
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

			# @all?
			toAll = mentionIds.indexOf('all') > -1

			if mentionIds.length > 0 || alwaysNotifyDesktopUsers.length > 0
				desktopMentionIds = _.union mentionIds, alwaysNotifyDesktopUsers
				desktopMentionIds = _.difference desktopMentionIds, dontNotifyDesktopUsers
				usersOfDesktopMentions = RocketChat.models.Users.find({_id: {$in: desktopMentionIds}}, {fields: {_id: 1, username: 1}}).fetch()

				# when a user is mentioned on a channel, make the user join that channel
				if room.t is 'c' and !toAll
					for usersOfMentionItem in usersOfDesktopMentions
						if room.usernames.indexOf(usersOfMentionItem.username) is -1
							Meteor.runAsUser usersOfMentionItem._id, ->
								Meteor.call 'joinRoom', room._id

				# Get ids of all mentioned users and users with notifications set to always.
				userIdsToNotify = _.pluck(usersOfDesktopMentions, '_id')

			if mentionIds.length > 0 || alwaysNotifyMobileUsers.length > 0
				mobileMentionIds = _.union mentionIds, alwaysNotifyMobileUsers
				mobileMentionIds = _.difference mobileMentionIds, dontNotifyMobileUsers
				usersOfMobileMentions = RocketChat.models.Users.find({_id: {$in: mobileMentionIds}}, {fields: {_id: 1, username: 1, statusConnection: 1}}).fetch()

				# Get ids of all mentioned users and users with notifications set to always.
				userIdsToPushNotify = _.pluck(_.filter(usersOfMobileMentions, (user) -> return user.statusConnection isnt 'online'), '_id')


			# If the message is @all, notify all room users except for the sender.
			if toAll and room.usernames?.length > 0
				usersOfRoom = RocketChat.models.Users.find({
						username: {$in: room.usernames},
						_id: {$ne: user._id}},
					{fields: {_id: 1, username: 1, status: 1, statusConnection: 1}})
					.forEach (user) ->
						if user.status in ['online', 'away', 'busy'] and user._id not in dontNotifyDesktopUsers
							userIdsToNotify.push user._id
						if user.statusConnection isnt 'online' and user._id not in dontNotifyMobileUsers
							userIdsToPushNotify.push user._id

				userIdsToNotify = _.unique userIdsToNotify
				userIdsToPushNotify = _.unique userIdsToPushNotify

			if userIdsToNotify.length > 0
				for usersOfMentionId in userIdsToNotify
					RocketChat.Notifications.notifyUser usersOfMentionId, 'notification',
						title: "@#{user.username} @ ##{room.name}"
						text: message.msg
						payload:
							rid: message.rid
							sender: message.u
							type: room.t
							name: room.name

			if userIdsToPushNotify.length > 0
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
							host: Meteor.absoluteUrl()
							rid: message.rid
							sender: message.u
							type: room.t
							name: room.name
						query:
							userId: $in: userIdsToPushNotify

			if mentionIds > 0
				###
				Update all other subscriptions of mentioned users to alert their owners and incrementing
				the unread counter for mentions and direct messages
				###
				if toAll
					# all users except sender if mention is for all
					RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId message.rid, user._id, 1
				else
					# the mentioned user if mention isn't for all
					RocketChat.models.Subscriptions.incUnreadForRoomIdAndUserIds message.rid, mentionIds, 1


		###
		Update all other subscriptions to alert their owners but witout incrementing
		the unread counter, as it is only for mentions and direct messages
		###
		RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId message.rid, message.u._id, true

	return message
