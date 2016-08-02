@spotlight =
	hide: ->
		$('.spotlight').addClass('hidden')

	show: ->
		$('.spotlight').removeClass('hidden')
		$('.spotlight input').focus()

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

				return collection.find({name: exp}, {limit: 10, sort: {unread: -1, ls: -1}}).fetch()

			getValue: (_id, collection, firstPartValue) ->
				doc = collection.findOne(_id)
				# if doc.type is 'u'
				# 	Meteor.call 'createDirectMessage', doc.username, (error, result) ->
				# 		if error
				# 			return handleError(error)

				# 		if result?.rid?
				# 			FlowRouter.go('direct', { username: doc.username })
				# 			event.currentTarget.value = ''
				# else if doc.type is 'r'
				FlowRouter.go FlowRouter.path RocketChat.roomTypes.getRouteLink doc.t, doc

				spotlight.hide()

				return ''

		return config
