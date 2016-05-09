@filteredUsers = new Mongo.Collection 'filtered-users'
@filteredUsersMemory = new Mongo.Collection null
@channelAutocomplete = new Mongo.Collection 'channel-autocomplete'

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
			getFilter: (collection, filter) ->
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

				# Get users of room
				if items.length < 5 and filter?.trim() isnt ''
					messageUsers = _.pluck(items, 'username')
					Tracker.nonreactive ->
						roomUsernames = RocketChat.models.Rooms.findOne(Session.get('openedRoom')).usernames
						for roomUsername in roomUsernames
							if messageUsers.indexOf(roomUsername) is -1 and exp.test(roomUsername)
								items.push
									_id: roomUsername
									username: roomUsername
									status: Session.get('user_' + roomUsername + '_status') or 'offline'

								if items.length >= 5
									break

				# Get users from db
				if items.length < 5 and filter?.trim() isnt ''
					messageUsers = _.pluck(items, 'username')
					template.userFilter.set
						name: filter
						except: messageUsers

					if template.subscriptionsReady()
						filteredUsers.find({username: exp}, {limit: 5 - messageUsers.length}).fetch().forEach (item) ->
							items.push
								_id: item.username
								username: item.username
								status: 'offline'

				all =
					_id: '@all'
					username: 'all'
					system: true
					name: t 'Notify_all_in_this_room'
					compatibility: 'channel group'

				exp = new RegExp("(^|\\s)#{RegExp.escape filter}", 'i')
				if exp.test(all.username) or exp.test(all.compatibility)
					items.unshift all

				template.resultsLength.set items.length
				return items

			getValue: (_id, collection, firstPartValue) ->
				if _id is '@all'
					if firstPartValue.indexOf(' ') > -1
						return 'all'

					return 'all:'

				if firstPartValue.indexOf(' ') > -1
					return _id

				return _id + ':'

		return config

	popupChannelConfig: ->
		self = this
		template = Template.instance()
		config =
			title: t('Channels')
			collection: channelAutocomplete
			trigger: '#'
			template: 'messagePopupChannel'
			getInput: self.getInput
			textFilterDelay: 200
			getFilter: (collection, filter) ->
				exp = new RegExp(filter, 'i')
				template.channelFilter.set filter
				if template.channelSubscription.ready()
					results = collection.find( { name: exp }, { limit: 5 }).fetch()
				else
					results = []

				template.resultsLength.set results.length
				return results

			getValue: (_id, collection) ->
				return collection.findOne(_id)?.name

		return config

	popupSlashCommandsConfig: ->
		self = this
		template = Template.instance()

		config =
			title: t('Commands')
			collection: RocketChat.slashCommands.commands
			trigger: '/'
			triggerAnywhere: false
			template: 'messagePopupSlashCommand'
			getInput: self.getInput
			getFilter: (collection, filter) ->
				commands = []
				for command, item of collection
					if command.indexOf(filter) > -1
						commands.push
							_id: command
							params: item.params
							description: TAPi18n.__ item.description

					if commands.length > 10
						break

				commands = commands.sort (a, b) ->
					return a._id > b._id

				template.resultsLength.set commands.length
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
				getInput: self.getInput
				getFilter: (collection, filter) ->
					results = []
					key = ':' + filter

					if RocketChat.emoji.asciiList[key] or filter.length < 2
						return []

					# use ascii
					for shortname, value of RocketChat.emoji.asciiList
						if results.length > 10
							break

						if shortname.startsWith(key)
							results.push
								_id: shortname
								data: [value]

					# use shortnames
					for shortname, data of collection
						if results.length > 10
							break

						if shortname.startsWith(key)
							results.push
								_id: shortname
								data: data

					#if filter.length >= 3
					results.sort (a, b) ->
						a._id.length - b._id.length

					template.resultsLength.set results.length
					return results

		return config

	subscriptionNotReady: ->
		template = Template.instance()
		return 'notready' if template.resultsLength.get() is 0 and not template.subscriptionsReady()

Template.messagePopupConfig.onCreated ->
	@userFilter = new ReactiveVar {}
	@channelFilter = new ReactiveVar ''
	@resultsLength = new ReactiveVar 0

	template = @
	@autorun ->
		template.userSubscription = template.subscribe 'filteredUsers', template.userFilter.get()

	@autorun ->
		template.channelSubscription = template.subscribe 'channelAutocomplete', template.channelFilter.get()
