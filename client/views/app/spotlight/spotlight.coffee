@spotlight =
	hide: ->
		$('.spotlight').addClass('hidden')

	show: ->
		$('.spotlight').removeClass('hidden')
		$('.spotlight input').focus()

Template.spotlight.helpers
	autocompleteSettingsRoomSearch: ->
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
					collection: 'UserAndRoom'
					subscription: 'roomSearch'
					field: 'name'
					template: Template.roomSearch
					noMatchTemplate: Template.roomSearchEmpty
					matchAll: true
					filter: { uid: { $ne: Meteor.userId() } }
					sort: 'name'
				}
			]
		}

Template.spotlight.events
	'autocompleteselect input': (event, template, doc) ->
		if doc.type is 'u'
			Meteor.call 'createDirectMessage', doc.username, (error, result) ->
				if error
					return Errors.throw error.reason

				if result?.rid?
					FlowRouter.go('direct', { username: doc.username })
					event.currentTarget.value = ''
		else if doc.type is 'r'
			FlowRouter.go FlowRouter.path RocketChat.roomTypes.getRouteLink doc.t, doc

			event.currentTarget.value = ''

		spotlight.hide()
