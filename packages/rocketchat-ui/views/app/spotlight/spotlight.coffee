@spotlight =
	hide: ->
		$('.spotlight').addClass('hidden')

	show: ->
		$('.spotlight input').val('')
		$('.spotlight').removeClass('hidden')
		$('.spotlight input').focus()

serverResults = new ReactiveVar
serverSearch = new ReactiveVar

Tracker.autorun ->
	text = serverSearch.get()
	serverResults.set()

	if text?.trim().length >= 2
		Meteor.call 'spotlight', text, Meteor.user().username, (err, results) ->
			if err?
				return console.log err

			serverResults.set(results)


Template.spotlight.helpers
	popupConfig: ->
		self = this
		template = Template.instance()
		config =
			cls: 'popup-down'
			collection: RocketChat.models.Subscriptions
			template: 'spotlightTemplate'
			trigger: ''
			suffix: ''
			getInput: () =>
				template.find('[name=spotlight]')
			textFilterDelay: 200
			getFilter: (collection, filter) ->
				exp = new RegExp("#{RegExp.escape filter}", 'i')

				serverSearch.set(filter)

				memory = collection.find({name: exp, rid: {$ne: Session.get('openedRoom')}}, {limit: 10, sort: {unread: -1, ls: -1}}).fetch()
				server = serverResults.get()

				if server?.users?.length > 0
					for user in server.users when not _.findWhere(memory, {t: 'd', name: user.username})?
						memory.push({
							_id: user._id
							t: 'd',
							name: user.username
						})

				if server?.rooms?.length > 0
					for room in server.rooms
						memory.push({
							_id: room._id
							t: 'c',
							name: room.name
						})

				return memory


			getValue: (_id, collection, firstPartValue) ->
				doc = collection.findOne(_id)

				if not doc?
					server = serverResults.get()

					if server?.users?.length > 0
						doc = _.findWhere(server.users, {_id: _id})
						if doc?
							doc.name = doc.username
							doc.t = 'd'

					if not doc? and server?.rooms?.length > 0
						doc = _.findWhere(server.rooms, {_id: _id})

				FlowRouter.go FlowRouter.path RocketChat.roomTypes.getRouteLink doc.t, doc

				spotlight.hide()

				return ''

		return config
