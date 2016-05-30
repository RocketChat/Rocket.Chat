Template.resetPassword.helpers({
	requirePasswordChange() {
		let user = Meteor.user();
		if (user) {
			return user.requirePasswordChange;
		}
	},
	requirePasswordChangeReason() {
		let user = Meteor.user();
		if (user) {
			return user.requirePasswordChangeReason;
		}
	}
});

Template.resetPassword.events({
	'submit #login-card': function(event, instance) {
		event.preventDefault();

		var button = instance.$('button.resetpass');
		RocketChat.Button.loading(button);

		if (Meteor.userId()) {
			Meteor.call('setUserPassword', instance.find('[name=newPassword]').value, function(error) {
				if (error) {
					console.log(error);
					swal({
						title: t('Error_changing_password'),
						type: 'error'
					});
				}
			});
		} else {
			Accounts.resetPassword(FlowRouter.getParam('token'), instance.find('[name=newPassword]').value, function(error) {
				RocketChat.Button.reset(button);
				if (error) {
					console.log(error);
					swal({
						title: t('Error_changing_password'),
						type: 'error'
					});
				} else {
					FlowRouter.go('home');
					toastr.success(t('Password_changed_successfully'));
					RocketChat.callbacks.run('userPasswordReset');
				}
			});
		}
	}
});

Template.resetPassword.onRendered(function() {
	this.find('[name=newPassword]').focus();
});
