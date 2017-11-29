/* globals Department, Livechat, LivechatVideoCall */
import visitor from '../../imports/client/visitor';
import _ from 'underscore';

Template.register.helpers({
	error() {
		return Template.instance().error.get();
	},
	welcomeMessage() {
		return '';
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

		const $name = instance.$('input[name=name]');
		const $email = instance.$('input[name=email]');
		if (!($name.val().trim() && $email.val().trim())) {
			return instance.showError(TAPi18n.__('Please_fill_name_and_email'));
		} else {
			let departmentId = instance.$('select[name=department]').val();
			if (!departmentId) {
				const department = Department.findOne({ showOnRegistration: true });
				if (department) {
					departmentId = department._id;
				}
			}

			const guest = {
				token: visitor.getToken(),
				name: $name.val(),
				email: $email.val(),
				department: Livechat.deparment || departmentId
			};
			Meteor.call('livechat:registerGuest', guest, function(error, result) {
				if (error != null) {
					return instance.showError(error.reason);
				}
				parentCall('callback', ['pre-chat-form-submit', _.omit(guest, 'token')]);
				visitor.setId(result._id);
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
	this.showError = (msg) => {
		$('.error').addClass('show');
		this.error.set(msg);
	};
	this.hideError = () => {
		$('.error').removeClass('show');
		this.error.set();
	};
});
