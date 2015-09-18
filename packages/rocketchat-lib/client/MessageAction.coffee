class @MessageAction
	constructor: ->
		@buttons = new ReactiveVar {}

	addButton: (config) =>
		unless config?.id
			throw new Meteor.Error "MessageAction-addButton-error", "Button id was not informed."

		Tracker.nonreactive =>
			btns = @buttons.get()
			btns[config.id] = config
			@buttons.set btns

	removeButton: (id) =>
		Tracker.nonreactive =>
			btns = @buttons.get()
			delete btns[id]
			@buttons.set btns

	updateButton: (id, config) =>
		Tracker.nonreactive =>
			btns = @buttons.get()
			if btns[id]
				btns[id] = _.extend btns[id], config 
				@buttons.set btns

	getButtons: =>
		return _.sortBy (_.toArray @buttons.get()), 'order'

	resetButtons: =>
		@buttons.set {}
