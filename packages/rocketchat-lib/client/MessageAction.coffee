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

	addButton: addButton
	removeButton: removeButton
	updateButton: updateButton
	getButtons: getButtons
	getButtonById: getButtonById
	resetButtons: resetButtons

Meteor.startup ->

	$(document).click (event) =>
		if !$(event.target).closest('.message-cog-container').length and !$(event.target).is('.message-cog-container')
			$('.message-dropdown:visible').hide()

	RocketChat.MessageAction.addButton
		id: 'edit-message'
		icon: 'icon-pencil'
		i18nLabel: 'Edit'
		context: [
			'message'
			'message-mobile'
		]
		action: (e, instance) ->
			console.log e
			console.log e.currentTarget
			message = $(e.currentTarget).closest('.message')[0]
			console.log message
			chatMessages[Session.get('openedRoom')].edit(message)
			$("\##{message.id} .message-dropdown").hide()
			input = instance.find('.input-message')
			Meteor.setTimeout ->
				input.focus()
			, 200
		validation: (message) ->
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
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			return if msg.classList.contains("system")
			swal {
				title: t('Are_you_sure')
				text: t('You_will_not_be_able_to_recover')
				type: 'warning'
				showCancelButton: true
				confirmButtonColor: '#DD6B55'
				confirmButtonText: t('Yes_delete_it')
				cancelButtonText: t('Cancel')
				closeOnConfirm: false
				html: false
			}, ->
				swal
					title: t('Deleted')
					text: t('Your_entry_has_been_deleted')
					type: 'success'
					timer: 1000
					showConfirmButton: false

				if chatMessages[Session.get('openedRoom')].editing.id is message._id
					chatMessages[Session.get('openedRoom')].clearEditing(message)
				chatMessages[Session.get('openedRoom')].deleteMsg(message)
		validation: (message) ->
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
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			$(event.currentTarget).attr('data-clipboard-text', document.location.origin + document.location.pathname + '?j=' + msg.id);
			toastr.success(TAPi18n.__('Copied'))
		order: 3
