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
				return collection.find({username: {$exists: true}, $or: [{name: exp}, {username: exp}]}, {limit: 10})
			getValue: (_id, collection) ->
				return collection.findOne(_id)?.username

		return config

	popupChannelConfig: ->
		self = this
		template = Template.instance()
		config =
			title: 'Channels'
			collection: ChatRoom
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