@mobileMessageMenu =
	show: (message, template, e, scope) ->
		if not window.plugins?.actionsheet?
			return

		options =
			'androidTheme': window.plugins.actionsheet.ANDROID_THEMES.THEME_HOLO_LIGHT
			'buttonLabels': [
				'Report Abuse'
				'Copy Message'
			]
			androidEnableCancelButton: true
			addCancelButtonWithLabel: TAPi18n.__('Cancel')
			# 'position': [20, 40] // for iPad pass in the [x, y] position of the popover

		buttonActions = [
			mobileMessageMenu.reportAbuse
			mobileMessageMenu.copyMessage
		]

		buttons = RocketChat.MessageAction.getButtons message, 'message-mobile'
		for button in buttons
			if button.id is 'delete-message'
				options.addDestructiveButtonWithLabel = TAPi18n.__(button.i18nLabel)
				buttonActions.unshift button.action
			else
				buttonActions.push button.action
				options.buttonLabels.push TAPi18n.__(button.i18nLabel)

		window.plugins.actionsheet.show options, (buttonIndex) ->
			if buttonActions[buttonIndex-1]?
				buttonActions[buttonIndex-1].call scope, e, template, message

	copyMessage: (e, t, message) ->
		cordova.plugins.clipboard.copy(message.msg)
		console.log 'copyMessage', message.msg

	reportAbuse: (e, t, message) ->
		swal {
			title: 'Report this message?'
			text: message.html
			inputPlaceholder: 'Why do you want to report?'
			type: 'input'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: "Report!"
			cancelButtonText: TAPi18n.__('Cancel')
			closeOnConfirm: false
			html: false
		}, (inputValue) ->
			if inputValue is false
				return false

			if inputValue is ""
				swal.showInputError("You need to write something!")
				return false

			Meteor.call 'reportMessage', message, inputValue

			swal
				title: "Report sent"
				text: "Thank you!"
				type: 'success'
				timer: 1000
				showConfirmButton: false
