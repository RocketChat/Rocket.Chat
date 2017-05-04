import toastr from 'toastr';
Template.adminInviteUser.helpers({
	isAdmin() {
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin');
	},
	inviteEmails() {
		return Template.instance().inviteEmails.get();
	}
});

Template.adminInviteUser.events({
	'click .send'(e, instance) {
		const emails = $('#inviteEmails').val().split(/[\s,;]/);
		const rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
		const validEmails = _.compact(_.map(emails, function(email) {
			if (rfcMailPattern.test(email)) {
				return email;
			}
		}));
		if (validEmails.length) {
			return Meteor.call('sendInvitationEmail', validEmails, function(error, result) {
				if (result) {
					instance.clearForm();
					instance.inviteEmails.set(validEmails);
				}
				if (error) {
					return handleError(error);
				}
			});
		} else {
			return toastr.error(t('Send_invitation_email_error'));
		}
	},
	'click .cancel'(e, instance) {
		instance.clearForm();
		instance.inviteEmails.set([]);
		return Template.currentData().tabBar.close();
	}
});

Template.adminInviteUser.onCreated(function() {
	this.inviteEmails = new ReactiveVar([]);
	return this.clearForm = function() {
		return $('#inviteEmails').val('');
	};
});
