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

		if not room.t? or room.t is 'd'

			###
			Update the other subscriptions
			###
			RocketChat.models.Subscriptions.incUnreadOfDirectForRoomIdExcludingUserId message.rid, message.u._id, 1

			userOfMention = RocketChat.models.Users.findOne({_id: message.rid.replace(message.u._id, '')}, {fields: {username: 1, statusConnection: 1, status: 1, emails: 1, settings: 1}})
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
							host: Meteor.absoluteUrl()
							rid: message.rid
							sender: message.u
							type: room.t
							name: room.name
						query:
							userId: userOfMention._id

				if userOfMention.status is 'offline' and userOfMention.settings?.preferences?.emailNotificationMode is true and userOfMention.emails and userOfMention.emails.length > 0
					Email.send
						to: userOfMention.emails[0].address
						from: RocketChat.settings.get('From_Email')
						subject: TAPi18n.__ "Offline_DM_Email", {site: RocketChat.settings.get('Site_Name'), user: user.username}
						html: "> " + message.msg

		else
			mentionIds = []
			message.mentions?.forEach (mention) ->
				mentionIds.push mention._id

			# @all?
			toAll = mentionIds.indexOf('all') > -1

			if mentionIds.length > 0
				usersOfMention = RocketChat.models.Users.find({_id: {$in: mentionIds}}, {fields: {_id: 1, username: 1, status: 1, emails: 1, settings: 1}}).fetch()

				if room.t is 'c' and !toAll
					for usersOfMentionItem in usersOfMention
						if room.usernames.indexOf(usersOfMentionItem.username) is -1
							Meteor.runAsUser usersOfMentionItem._id, ->
								Meteor.call 'joinRoom', room._id

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

				# Get ids of all mentioned users.
				userIdsToNotify = _.pluck(usersOfMention, '_id')
				userIdsToPushNotify = userIdsToNotify

				offlineMentionsRoom = _.filter usersOfMention, (user) ->
					user.status is 'offline' and user.settings?.preferences?.emailNotificationMode is true

				# If the message is @all, notify all room users except for the sender.
				if toAll and room.usernames?.length > 0
					usersOfRoom = RocketChat.models.Users.find({
							username: {$in: room.usernames},
							_id: {$ne: user._id}},
						{fields: {_id: 1, username: 1, status: 1, emails: 1, settings: 1}})
						.fetch()
					onlineUsersOfRoom = _.filter usersOfRoom, (user) ->
						user.status in ['online', 'away', 'busy']
					userIdsToNotify = _.union userIdsToNotify, _.pluck(onlineUsersOfRoom, '_id')
					userIdsToPushNotify = _.union userIdsToPushNotify, _.pluck(usersOfRoom, '_id')
					offlineMentionsRoom = _.filter usersOfRoom, (user) ->
						user.status is 'offline' and user.settings?.preferences?.emailNotificationMode is true

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

				if offlineMentionsRoom.length > 0
					for offlineUser in offlineMentionsRoom
						if offlineUser.emails and offlineUser.emails.length > 0
							Email.send
								to: offlineUser.emails[0].address
								from: RocketChat.settings.get('From_Email')
								subject: TAPi18n.__ "Offline_Mention_Email", {site: RocketChat.settings.get('Site_Name'), user: user.username, room: room.name}
								html: "> " + message.msg
		###
		Update all other subscriptions to alert their owners but witout incrementing
		the unread counter, as it is only for mentions and direct messages
		###
		RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId message.rid, message.u._id, true

	return message
