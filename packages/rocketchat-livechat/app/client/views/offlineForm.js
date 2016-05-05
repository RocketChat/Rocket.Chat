Template.offlineForm.helpers({
	error() {
		return Template.instance().error.get();
	},
	messageSent() {
		return Template.instance().messageSent.get();
	}
});

Template.offlineForm.events({
	'submit form'(event, instance) {
		event.preventDefault();

		const form = event.currentTarget;

		let data = {
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
