Template.resetPassword.events({
	'submit #login-card': function(event, instance) {
		event.preventDefault();

		var button = instance.$('button.resetpass');
		RocketChat.Button.loading(button);

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
			}
		});
	}
});

Template.resetPassword.onRendered(function() {
	this.find('[name=newPassword]').focus();
});
