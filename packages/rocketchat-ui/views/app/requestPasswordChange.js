Template.requestPasswordChange.events({
	'submit'(e, instance) {
		e.preventDefault();
		oldPassword = s.trim(instance.$('#oldPassword').val());
		newPassword = s.trim(instance.$('#newPassword').val());
		instance.changePassword(oldPassword, newPassword);
	}
})

Template.requestPasswordChange.onCreated(function() {
	this.changePassword = function(oldPassword, newPassword) {
		if (!oldPassword || !newPassword) {
			toastr.warning(t('Old_and_new_password_required'));
		} else if (oldPassword === newPassword) {
			toastr.warning(t('Old_and_new_password_must_be_different'));
		} else {
			Accounts.changePassword(oldPassword, newPassword, function(error) {
				if(error) {
					toastr.error(t('Incorrect_Password'));
				} else {
					Meteor.call('clearRequirePasswordChange', function() {
						toastr.success(t('Password_changed_successfully'))
						return true;
					});
				}
			});
		}
	}
})

Template.requestPasswordChange.onRendered(function() {
	this.$('#oldPassword').focus();
})