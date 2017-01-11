@filteredUsersMemory = new Mongo.Collection null

Meteor.startup ->
	Tracker.autorun ->
		if not Meteor.user()? or not Session.get('openedRoom')?
			return

		filteredUsersMemory.remove({})
		messageUsers = RocketChat.models.Messages.find({rid: Session.get('openedRoom'), 'u.username': {$ne: Meteor.user().username}}, {fields: {'u.username': 1, ts: 1}, sort: {ts: -1}}).fetch()
		uniqueMessageUsersControl = {}
		messageUsers.forEach (messageUser) ->
			if not uniqueMessageUsersControl[messageUser.u.username]?
				uniqueMessageUsersControl[messageUser.u.username] = true
				filteredUsersMemory.upsert messageUser.u.username,
					_id: messageUser.u.username
					username: messageUser.u.username
					status: Session.get('user_' + messageUser.u.username + '_status') or 'offline'
					ts: messageUser.ts


getUsersFromServer = (filter, records, cb) =>
	messageUsers = _.pluck(records, 'username')
	Meteor.call 'spotlight', filter, messageUsers, { users: true }, (err, results) ->
		if err?
			return console.error err

		if results.users.length > 0
			for result in results.users
				if records.length < 5
					records.push
						_id: result.username
						username: result.username
						status: 'offline'
						sort: 3

			records = _.sortBy(records, 'sort')

			cb(records)

getRoomsFromServer = (filter, records, cb) =>
	Meteor.call 'spotlight', filter, null, { rooms: true }, (err, results) ->
		if err?
			return console.error err

		if results.rooms.length > 0
			for room in results.rooms
				if records.length < 5
					records.push room

			cb(records)

getUsersFromServerDelayed = _.throttle getUsersFromServer, 500
getRoomsFromServerDelayed = _.throttle getRoomsFromServer, 500


Template.messagePopupConfig.helpers
	popupUserConfig: ->
		self = this
		template = Template.instance()

		config =
			title: t('People')
			collection: filteredUsersMemory
			template: 'messagePopupUser'
			getInput: self.getInput
			textFilterDelay: 200
			trigger: '@'
			suffix: ' '
			getFilter: (collection, filter, cb) ->
				exp = new RegExp("#{RegExp.escape filter}", 'i')

				# Get users from messages
				items = filteredUsersMemory.find({ts: {$exists: true}, username: exp}, {limit: 5, sort: {ts: -1}}).fetch()

				# Get online users
				if items.length < 5 and filter?.trim() isnt ''
					messageUsers = _.pluck(items, 'username')
					Meteor.users.find({$and: [{username: exp}, {username: {$nin: [Meteor.user()?.username].concat(messageUsers)}}]}, {limit: 5 - messageUsers.length}).fetch().forEach (item) ->
						items.push
							_id: item.username
							username: item.username
							status: item.status
							sort: 1

				# # Get users of room
				# if items.length < 5 and filter?.trim() isnt ''
				# 	messageUsers = _.pluck(items, 'username')
				# 	Tracker.nonreactive ->
				# 		roomUsernames = RocketChat.models.Rooms.findOne(Session.get('openedRoom')).usernames
				# 		for roomUsername in roomUsernames
				# 			if messageUsers.indexOf(roomUsername) is -1 and exp.test(roomUsername)
				# 				items.push
				# 					_id: roomUsername
				# 					username: roomUsername
				# 					status: Session.get('user_' + roomUsername + '_status') or 'offline'
				# 					sort: 2

				# 				if items.length >= 5
				# 					break

				# Get users from db
				if items.length < 5 and filter?.trim() isnt ''
					getUsersFromServerDelayed filter, items, cb

				all =
					_id: 'all'
					username: 'all'
					system: true
					name: t 'Notify_all_in_this_room'
					compatibility: 'channel group'
					sort: 4

				exp = new RegExp("(^|\\s)#{RegExp.escape filter}", 'i')
				if exp.test(all.username) or exp.test(all.compatibility)
					items.push all

				here =
					_id: 'here'
					username: 'here'
					system: true
					name: t 'Notify_active_in_this_room'
					compatibility: 'channel group'
					sort: 4

				if exp.test(here.username) or exp.test(here.compatibility)
					items.push here

				return items

			getValue: (_id) ->
				return _id

		return config

	popupChannelConfig: ->
		self = this
		template = Template.instance()

		config =
			title: t('Channels')
			collection: RocketChat.models.Subscriptions
			trigger: '#'
			suffix: ' '
			template: 'messagePopupChannel'
			getInput: self.getInput
			getFilter: (collection, filter, cb) ->
				exp = new RegExp(filter, 'i')

				records = collection.find({name: exp, t: {$in: ['c', 'p']}}, {limit: 5, sort: {ls: -1}}).fetch()

				if records.length < 5 and filter?.trim() isnt ''
					getRoomsFromServerDelayed filter, records, cb

				return records

			getValue: (_id, collection, records) ->
				return _.findWhere(records, {_id: _id})?.name

		return config

	popupSlashCommandsConfig: ->
		self = this
		template = Template.instance()

		config =
			title: t('Commands')
			collection: RocketChat.slashCommands.commands
			trigger: '/'
			suffix: ' '
			triggerAnywhere: false
			template: 'messagePopupSlashCommand'
			getInput: self.getInput
			getFilter: (collection, filter) ->
				commands = []
				for command, item of collection
					if command.indexOf(filter) > -1
						commands.push
							_id: command
							params: if item.params then TAPi18n.__ item.params else ''
							description: TAPi18n.__ item.description

				commands = commands.sort (a, b) ->
					return a._id > b._id

				commands = commands[0..10]

				return commands

		return config

	emojiEnabled: ->
		return RocketChat.emoji?

	popupEmojiConfig: ->
		if RocketChat.emoji?
			self = this
			template = Template.instance()
			config =
				title: t('Emoji')
				collection: RocketChat.emoji.list
				template: 'messagePopupEmoji'
				trigger: ':'
				prefix: ''
				suffix: ' '
				getInput: self.getInput
				getFilter: (collection, filter, cb) ->
					results = []
					key = ':' + filter

					if RocketChat.emoji.packages.emojione?.asciiList[key] or filter.length < 2
						return []

					regExp = new RegExp('^' + RegExp.escape(key), 'i')

					for key, value of collection
						if results.length > 10
							break

						if regExp.test(key)
							results.push
								_id: key
								data: value

					results.sort (a, b) ->
						if a._id < b._id
							return -1
						if a._id > b._id
							return 1
						return 0

					return results

		return config
