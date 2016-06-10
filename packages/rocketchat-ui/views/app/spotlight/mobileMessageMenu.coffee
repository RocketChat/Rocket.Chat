@mobileMessageMenu =
	show: (message, template, e, scope) ->
		if not window.plugins?.actionsheet?
			return

		options =
			'androidTheme': window.plugins.actionsheet.ANDROID_THEMES.THEME_HOLO_LIGHT
			'buttonLabels': [
				TAPi18n.__('Report Abuse')
			]
			androidEnableCancelButton: true
			addCancelButtonWithLabel: TAPi18n.__('Cancel')
			# 'position': [20, 40] // for iPad pass in the [x, y] position of the popover

		buttonActions = [
			mobileMessageMenu.reportAbuse
		]

		buttons = RocketChat.MessageAction.getButtons message, (message.customClass or 'message-mobile')
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

	reportAbuse: (e, t, message) ->
		swal {
			title: TAPi18n.__('Report_this_message_question_mark')
			text: message.msg
			inputPlaceholder: TAPi18n.__('Why_do_you_want_to_report_question_mark')
			type: 'input'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: TAPi18n.__("Report_exclamation_mark")
			cancelButtonText: TAPi18n.__('Cancel')
			closeOnConfirm: false
			html: false
		}, (inputValue) ->
			if inputValue is false
				return false

			if inputValue is ""
				swal.showInputError(TAPi18n.__("You_need_to_write_something"))
				return false

			Meteor.call 'reportMessage', message, inputValue

			swal
				title: TAPi18n.__("Report_sent")
				text: TAPi18n("Thank_you_exclamation_mark")
				type: 'success'
				timer: 1000
				showConfirmButton: false
