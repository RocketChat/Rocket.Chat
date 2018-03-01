import _ from 'underscore';
import s from 'underscore.string';

Template.offlineForm.helpers({
	error() {
		return Template.instance().error.get();
	},
	messageSent() {
		return Template.instance().messageSent.get();
	},
	offlineMessage() {
		return (!_.isEmpty(this.offlineMessage)) ? this.offlineMessage.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2') : TAPi18n.__('We_are_not_online_right_now_please_leave_a_message');
	},
	offlineSuccessMessage() {
		if (!_.isEmpty(this.offlineSuccessMessage)) {
			return this.offlineSuccessMessage.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
		} else {
			return TAPi18n.__('Thanks_We_ll_get_back_to_you_soon');
		}
	}
});

Template.offlineForm.events({
	'submit form'(event, instance) {
		event.preventDefault();

		const form = event.currentTarget;

		const data = {
			name: form.elements['name'].value,
			email: form.elements['email'].value,
			message: form.elements['message'].value
		};

		if (!instance.validateForm(form)) {
			instance.showError(TAPi18n.__('You_must_complete_all_fields'));
			return;
		}

		instance.$('.send').attr('disabled', 'disabled');

		Meteor.call('livechat:sendOfflineMessage', data, (error) => {
			instance.$('.send').attr('disabled', null);

			if (error) {
				return instance.showError(error.reason);
			} else {
				instance.messageSent.set(true);
				parentCall('callback', ['offline-form-submit', data]);
			}
		});
	}
});

Template.offlineForm.onCreated(function() {
	this.error = new ReactiveVar();
	this.messageSent = new ReactiveVar(false);

	this.validateForm = (form) => {
		let valid = true;

		const fields = ['name', 'email', 'message'];

		for (let i = 0; i < fields.length; i++) {
			$(form.elements[fields[i]]).removeClass('field-error');

			if (_.isEmpty(s.trim(form.elements[fields[i]].value))) {
				$(form.elements[fields[i]]).addClass('field-error');
				valid = false;
			}
		}

		return valid;
	};

	this.showError = (msg) => {
		$('.error').addClass('show');
		this.error.set(msg);
	};
	this.hideError = () => {
		$('.error').removeClass('show');
		this.error.set();
	};
});
