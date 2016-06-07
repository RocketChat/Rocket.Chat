RocketChat.MessageAction = new class
	buttons = new ReactiveVar {}

	###
	config expects the following keys (only id is mandatory):
		id (mandatory)
		icon: string
		i18nLabel: string
		action: function(event, instance)
		validation: function(message)
		order: integer
	###
	addButton = (config) ->
		unless config?.id
			return false

		Tracker.nonreactive ->
			btns = buttons.get()
			btns[config.id] = config
			buttons.set btns

	removeButton = (id) ->
		Tracker.nonreactive ->
			btns = buttons.get()
			delete btns[id]
			buttons.set btns

	updateButton = (id, config) ->
		Tracker.nonreactive ->
			btns = buttons.get()
			if btns[id]
				btns[id] = _.extend btns[id], config
				buttons.set btns

	getButtonById = (id) ->
		allButtons = buttons.get()
		return allButtons[id]

	getButtons = (message, context) ->
		allButtons = _.toArray buttons.get()
		if message
			allowedButtons = _.compact _.map allButtons, (button) ->
				if not button.context? or button.context.indexOf(context) > -1
					if not button.validation? or button.validation(message, context)
						return button
		else
			allowedButtons = allButtons

		return _.sortBy allowedButtons, 'order'

	resetButtons = ->
		buttons.set {}

	getPermaLink = (msgId) ->
		roomData = ChatSubscription.findOne({rid: Session.get('openedRoom')})
		if roomData
			routePath = RocketChat.roomTypes.getRouteLink(roomData.t, roomData)
		else
			routePath = document.location.pathname
		return Meteor.absoluteUrl().replace(/\/$/, '') + routePath + '?msg=' + msgId

	hideDropDown = () ->
		$('.message-dropdown:visible').hide()

	addButton: addButton
	removeButton: removeButton
	updateButton: updateButton
	getButtons: getButtons
	getButtonById: getButtonById
	resetButtons: resetButtons
	getPermaLink: getPermaLink
	hideDropDown: hideDropDown

Meteor.startup ->

	$(document).click (event) =>
		target = $(event.target)
		if !target.closest('.message-cog-container').length and !target.is('.message-cog-container')
			RocketChat.MessageAction.hideDropDown()

	RocketChat.MessageAction.addButton
		id: 'edit-message'
		icon: 'icon-pencil'
		i18nLabel: 'Edit'
		context: [
			'message'
			'message-mobile'
		]
		action: (e, instance) ->
			message = $(e.currentTarget).closest('.message')[0]
			chatMessages[Session.get('openedRoom')].edit(message)
			RocketChat.MessageAction.hideDropDown()
			input = instance.find('.input-message')
			Meteor.setTimeout ->
				input.focus()
				input.updateAutogrow()
			, 200
		validation: (message) ->
			room = RocketChat.models.Rooms.findOne({ _id: message.rid })

			if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
				return false

			hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid)
			isEditAllowed = RocketChat.settings.get 'Message_AllowEditing'
			editOwn = message.u?._id is Meteor.userId()

			return unless hasPermission or (isEditAllowed and editOwn)

			blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
			if blockEditInMinutes? and blockEditInMinutes isnt 0
				msgTs = moment(message.ts) if message.ts?
				currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
				return currentTsDiff < blockEditInMinutes
			else
				return true
		order: 1

	RocketChat.MessageAction.addButton
		id: 'delete-message'
		icon: 'icon-trash-alt'
		i18nLabel: 'Delete'
		context: [
			'message'
			'message-mobile'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			RocketChat.MessageAction.hideDropDown()
			chatMessages[Session.get('openedRoom')].confirmDeleteMsg(message)
		validation: (message) ->
			room = RocketChat.models.Rooms.findOne({ _id: message.rid })

			if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
				return false

			hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid)
			isDeleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'
			deleteOwn = message.u?._id is Meteor.userId()

			return unless hasPermission or (isDeleteAllowed and deleteOwn)

			blockDeleteInMinutes = RocketChat.settings.get 'Message_AllowDeleting_BlockDeleteInMinutes'
			if blockDeleteInMinutes? and blockDeleteInMinutes isnt 0
				msgTs = moment(message.ts) if message.ts?
				currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
				return currentTsDiff < blockDeleteInMinutes
			else
				return true
		order: 2

	RocketChat.MessageAction.addButton
		id: 'permalink'
		icon: 'icon-link'
		i18nLabel: 'Permalink'
		classes: 'clipboard'
		context: [
			'message'
			'message-mobile'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			RocketChat.MessageAction.hideDropDown()
			$(event.currentTarget).attr('data-clipboard-text', RocketChat.MessageAction.getPermaLink(message._id));
			toastr.success(TAPi18n.__('Copied'))
		validation: (message) ->
			room = RocketChat.models.Rooms.findOne({ _id: message.rid })

			if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
				return false

			return true
		order: 3

	RocketChat.MessageAction.addButton
		id: 'copy'
		icon: 'icon-paste'
		i18nLabel: 'Copy'
		classes: 'clipboard'
		context: [
			'message'
			'message-mobile'
		]
		action: (event, instance) ->
			message = @_arguments[1].msg
			RocketChat.MessageAction.hideDropDown()
			$(event.currentTarget).attr('data-clipboard-text', message)
			toastr.success(TAPi18n.__('Copied'))
		validation: (message) ->
			room = RocketChat.models.Rooms.findOne({ _id: message.rid })

			if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
				return false

			return true
		order: 4

	RocketChat.MessageAction.addButton
		id: 'quote-message'
		icon: 'icon-quote-left'
		i18nLabel: 'Quote'
		context: [
			'message'
			'message-mobile'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			input = instance.find('.input-message')
			url = RocketChat.MessageAction.getPermaLink(message._id)
			text = '[ ](' + url + ') '
			if input.value
				input.value += if input.value.endsWith(' ') then '' else ' '
			input.value += text
			input.focus()
			$(input).keyup()
			RocketChat.MessageAction.hideDropDown()
		validation: (message) ->
			room = RocketChat.models.Rooms.findOne({ _id: message.rid })

			if Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) is -1
				return false

			return true
		order: 5
