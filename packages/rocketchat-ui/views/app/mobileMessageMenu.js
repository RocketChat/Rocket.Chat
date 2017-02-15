const mobileMessageMenu = {
	show(message, template, e, scope) {
		if (!window.plugins.actionsheet) {
			return false;
		}

		const options = {
			'androidTheme': window.plugins.actionsheet.ANDROID_THEMES.THEME_HOLO_LIGHT,
			'buttonLabels': [
				TAPi18n.__('Report Abuse')
			],
			androidEnableCancelButton: true,
			addCancelButtonWithLabel: TAPi18n.__('Cancel')
		};

		const buttonActions = [
			mobileMessageMenu.reportAbuse
		];

		const buttons = RocketChat.MessageAction.getButtons(message, message.customClass || 'message-mobile');

		for (let i = 0, len = buttons.length; i < len; i++) {
			if (buttons[i].id === 'delete-message') {
				options.addDestructiveButtonWithLabel = TAPi18n.__(buttons[i].i18nLabel);
				buttonActions.unshift(buttons[i].action);
			} else {
				buttonActions.push(buttons[i].action);
				options.buttonLabels.push(TAPi18n.__(buttons[i].i18nLabel));
			}
		}

		window.plugins.actionsheet.show(options, (buttonIndex) => {
			if (buttonActions[buttonIndex - 1] != null) {
				return buttonActions[buttonIndex - 1].call(scope, e, template, message);
			}
		});

	},
	reportAbuse: (e, t, message) => {
		swal({
			title: TAPi18n.__('Report_this_message_question_mark'),
			text: message.msg,
			inputPlaceholder: TAPi18n.__('Why_do_you_want_to_report_question_mark'),
			type: 'input',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: TAPi18n.__('Report_exclamation_mark'),
			cancelButtonText: TAPi18n.__('Cancel'),
			closeOnConfirm: false,
			html: false
		}, (inputValue) => {
			if (inputValue === false) {
				return false;
			}

			if (inputValue === '') {
				swal.showInputError(TAPi18n.__('You_need_to_write_something'));
				return false;
			}

			Meteor.call('reportMessage', message._id, inputValue);

			swal({
				title: TAPi18n.__('Report_sent'),
				text: TAPi18n.__('Thank_you_exclamation_mark '),
				type: 'success',
				timer: 1000,
				showConfirmButton: false
			});
		});
	}
};

this.mobileMessageMenu = mobileMessageMenu;
