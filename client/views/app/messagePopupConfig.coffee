Template.messagePopupConfig.helpers
	popupUserConfig: ->
		self = this
		template = Template.instance()
		config =
			title: 'People'
			collection: Meteor.users
			template: 'messagePopupUser'
			getInput: self.getInput
			getFilter: (collection, filter) ->
				exp = new RegExp(filter, 'i')
				items = collection.find({username: {$exists: true}, $or: [{name: exp}, {username: exp}]}, {limit: 10}).fetch()

				all =
					_id: '@all'
					username: '@all'
					name: t 'Notify_all_in_this_room'
					compatibility: 'channel group'

				if exp.test(all.username) or exp.test(all.name) or exp.test(all.compatibility)
					items.unshift all

				return items
			getValue: (_id, collection, firstPartValue) ->
				if _id is '@all'
					if firstPartValue.indexOf(' ') > -1
						return 'all'

					return 'all:'

				username = collection.findOne(_id)?.username

				if firstPartValue.indexOf(' ') > -1
					return username

				return username + ':'

		return config

	popupChannelConfig: ->
		self = this
		template = Template.instance()
		config =
			title: 'Channels'
			collection: ChatSubscription
			trigger: '#'
			template: 'messagePopupChannel'
			getInput: self.getInput
			getFilter: (collection, filter) ->
				return collection.find({t: 'c', name: new RegExp(filter, 'i')}, {limit: 10})
			getValue: (_id, collection) ->
				return collection.findOne(_id)?.name

		return config

	popupEmojiConfig: ->
		self = this
		template = Template.instance()
		config =
			title: 'Emoji'
			collection: emojione.emojioneList
			template: 'messagePopupEmoji'
			trigger: ':'
			prefix: ''
			getInput: self.getInput
			getFilter: (collection, filter) ->
				results = []
				for shortname, data of collection
					if shortname.indexOf(filter) > -1
						results.push
							_id: shortname
							data: data

					if results.length > 10
						break

				if filter.length >= 3
					results.sort (a, b) ->
						a.length > b.length

				return results

		return config