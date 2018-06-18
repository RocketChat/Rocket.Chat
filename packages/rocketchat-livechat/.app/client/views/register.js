/* globals Department, Livechat, LivechatVideoCall */
import visitor from '../../imports/client/visitor';
import _ from 'underscore';
import s from 'underscore.string';

Template.register.helpers({
	error() {
		return Template.instance().error.get();
	},
	welcomeMessage() {
		return '';
	},
	showDepartments() {
		return Department.find({ showOnRegistration: true }).count() > 0;
	},
	departments() {
		return Department.find({ showOnRegistration: true });
	},
	videoCallEnabled() {
		return Livechat.videoCall;
	},
	selectedDepartment() {
		return this._id === Livechat.department;
	},
	showNameFieldRegisterForm() {
		return Livechat.nameFieldRegistrationForm;
	},
	showEmailFieldRegisterForm() {
		return Livechat.emailFieldRegistrationForm;
	}
});

Template.register.events({
	'submit #livechat-registration'(e, instance) {
		e.preventDefault();

		const start = () => {
			instance.hideError();
			if (instance.request === 'video') {
				LivechatVideoCall.request();
			}
		};
		const form = e.currentTarget;

		const fields = [];
		let name;
		let email;
		let department;

		if (Livechat.nameFieldRegistrationForm) {
			fields.push('name');
			name = instance.$('input[name=name]').val();
		}

		if (Livechat.emailFieldRegistrationForm) {
			fields.push('email');
			email = instance.$('input[name=email]').val();
		}

		if (Department.find({ showOnRegistration: true }).count() > 0) {
			fields.push('department');
			department = instance.$('select[name=department]').val();
		}

		if (!instance.validateForm(form, fields)) {
			return instance.showError(TAPi18n.__('You_must_complete_all_fields'));
		} else {
			const guest = {
				token: visitor.getToken(),
				name,
				email,
				department: department || Livechat.department
			};
			Meteor.call('livechat:registerGuest', guest, function(error, result) {
				if (error != null) {
					return instance.showError(error.reason);
				}
				parentCall('callback', ['pre-chat-form-submit', _.omit(guest, 'token')]);
				visitor.setId(result.userId);
				start();
			});
		}
	},
	'click .error'(e, instance) {
		return instance.hideError();
	},
	'click .request-chat'(e, instance) {
		instance.request = 'chat';
	},
	'click .request-video'(e, instance) {
		instance.request = 'video';
	}
});

Template.register.onCreated(function() {
	this.error = new ReactiveVar();
	this.request = '';

	this.validateForm = (form, fields) => {
		const valid = fields.every((field) => {
			return !_.isEmpty(s.trim(form.elements[field].value));
		});

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
