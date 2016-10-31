@spotlight =
	hide: ->
		$('.spotlight').addClass('hidden')

	show: ->
		$('.spotlight input').val('')
		$('.spotlight').removeClass('hidden')
		$('.spotlight input').focus()

getFromServer = (filter, records, cb) =>
	Meteor.call 'spotlight', filter, Meteor.user().username, (err, results) ->
		if err?
			return console.log err

		server = []

		if results?.users?.length > 0
			for user in results.users when not _.findWhere(records, {t: 'd', name: user.username})?
				server.push({
					_id: user._id
					t: 'd',
					name: user.username
				})

		if results?.rooms?.length > 0
			for room in results.rooms
				server.push({
					_id: room._id
					t: 'c',
					name: room.name
				})

		if server.length > 0
			cb(records.concat(server))

getFromServerDelayed = _.throttle getFromServer, 500

Template.spotlight.helpers
	popupConfig: ->
		config =
			cls: 'popup-down'
			collection: RocketChat.models.Subscriptions
			template: 'spotlightTemplate'
			input: '[name=spotlight]'
			getFilter: (collection, filter, cb) ->
				exp = new RegExp("#{RegExp.escape filter}", 'i')

				records = collection.find({name: exp, rid: {$ne: Session.get('openedRoom')}}, {limit: 10, sort: {unread: -1, ls: -1}}).fetch()

				cb(records)

				if filter?.trim().length < 1 or records.length >= 5
					return

				getFromServerDelayed(filter, records, cb)

			getValue: (_id, collection, records, firstPartValue) ->
				doc = _.findWhere(records, {_id: _id})

				FlowRouter.go(RocketChat.roomTypes.getRouteLink(doc.t, doc), null, FlowRouter.current().queryParams)

				spotlight.hide()

		return config
