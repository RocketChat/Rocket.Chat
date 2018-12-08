/* globals Department, Livechat, LivechatVideoCall */
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import visitor from '../../imports/client/visitor';
import _ from 'underscore';
import s from 'underscore.string';

Template.register.helpers({
	error() {
		return Template.instance().error.get();
	},
	welcomeMessage() {
		return Livechat.registrationFormMessage;
	},
	showDepartments() {
		return Department.find({ showOnRegistration: true }).count() > 1;
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
	},
	getName() {
		return Livechat.guestName;
	},
	getEmail() {
		return Livechat.guestEmail;
	},
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
		let name = Livechat.guestName;
		let email = Livechat.guestEmail;

		if (Livechat.nameFieldRegistrationForm) {
			fields.push('name');
			name = instance.$('input[name=name]').val();
		}

		if (Livechat.emailFieldRegistrationForm) {
			fields.push('email');
			email = instance.$('input[name=email]').val();
		}

		if (!instance.validateForm(form, fields)) {
			return instance.showError(TAPi18n.__('You_must_complete_all_fields'));
		} else {
			let departmentId = instance.$('select[name=department]').val();
			if (!departmentId) {
				const department = Department.findOne({ showOnRegistration: true });
				if (department) {
					departmentId = department._id;
				}
			}

			if (departmentId) {
				Livechat.department = departmentId;
			}

			const guest = {
				token: visitor.getToken(),
				name,
				email,
				department: Livechat.department,
			};

			Meteor.call('livechat:registerGuest', guest, function(error, result) {
				if (error != null) {
					return instance.showError(error.reason);
				}
				parentCall('callback', ['pre-chat-form-submit', _.omit(guest, 'token')]);
				visitor.setId(result.userId);
				visitor.setData(result.visitor);
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
	},
});

Template.register.onCreated(function() {
	this.error = new ReactiveVar();
	this.request = '';

	this.validateForm = (form, fields) => {
		const valid = fields.every((field) => !_.isEmpty(s.trim(form.elements[field].value)));

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
