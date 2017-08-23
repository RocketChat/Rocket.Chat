import toastr from 'toastr';
Template.accountProfile.helpers({
	allowDeleteOwnAccount() {
		return RocketChat.settings.get('Accounts_AllowDeleteOwnAccount');
	},
	realname() {
		return Meteor.user().name;
	},
	username() {
		return Meteor.user().username;
	},
	email() {
		const user = Meteor.user();
		return user.emails && user.emails[0] && user.emails[0].address;
	},
	emailVerified() {
		const user = Meteor.user();
		return user.emails && user.emails[0] && user.emails[0].verified;
	},
	allowUsernameChange() {
		return RocketChat.settings.get('Accounts_AllowUsernameChange') && RocketChat.settings.get('LDAP_Enable') !== true;
	},
	allowEmailChange() {
		return RocketChat.settings.get('Accounts_AllowEmailChange');
	},
	usernameChangeDisabled() {
		return t('Username_Change_Disabled');
	},
	allowPasswordChange() {
		return RocketChat.settings.get('Accounts_AllowPasswordChange');
	},
	passwordChangeDisabled() {
		return t('Password_Change_Disabled');
	},
	customFields() {
		return Meteor.user().customFields;
	}
});

Template.accountProfile.onCreated(function() {
	const settingsTemplate = this.parentTemplate(3);
	if (settingsTemplate.child == null) {
		settingsTemplate.child = [];
	}
	settingsTemplate.child.push(this);
	this.clearForm = function() {
		this.find('#password').value = '';
	};
	this.changePassword = function(newPassword, callback) {
		const instance = this;
		if (!newPassword) {
			return callback();
		} else if (!RocketChat.settings.get('Accounts_AllowPasswordChange')) {
			toastr.remove();
			toastr.error(t('Password_Change_Disabled'));
			instance.clearForm();
			return;
		}
	};
	this.save = function(typedPassword) {
		const instance = this;
		const data = {
			typedPassword
		};
		if (_.trim($('#password').val()) && RocketChat.settings.get('Accounts_AllowPasswordChange')) {
			data.newPassword = $('#password').val();
		}
		if (_.trim($('#realname').val())) {
			data.realname = _.trim($('#realname').val());
		}
		if (_.trim($('#username').val()) !== Meteor.user().username) {
			if (!RocketChat.settings.get('Accounts_AllowUsernameChange')) {
				toastr.remove();
				toastr.error(t('Username_Change_Disabled'));
				instance.clearForm();
				return;
			} else {
				data.username = _.trim($('#username').val());
			}
		}
		const user = Meteor.user();
		if (_.trim($('#email').val()) !== (user.emails && user.emails[0] && user.emails[0].address)) {
			if (!RocketChat.settings.get('Accounts_AllowEmailChange')) {
				toastr.remove();
				toastr.error(t('Email_Change_Disabled'));
				instance.clearForm();
				return;
			} else {
				data.email = _.trim($('#email').val());
			}
		}
		const customFields = {};
		$('[data-customfield=true]').each(function() {
			customFields[this.name] = $(this).val() || '';
		});
		Meteor.call('saveUserProfile', data, customFields, function(error, results) {
			if (results) {
				toastr.remove();
				toastr.success(t('Profile_saved_successfully'));
				swal.close();
				instance.clearForm();
			}
			if (error) {
				toastr.remove();
				return handleError(error);
			}
		});
	};
});

Template.accountProfile.onRendered(function() {
	Tracker.afterFlush(function() {
		if (!RocketChat.settings.get('Accounts_AllowUserProfileChange')) {
			FlowRouter.go('home');
		}
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});

Template.accountProfile.events({
	'click .submit button'(e, instance) {
		const user = Meteor.user();
		const reqPass = ((_.trim($('#email').val()) !== (user && user.emails && user.emails[0] && user.emails[0].address)) || _.trim($('#password').val())) && (user && user.services && user.services.password && s.trim(user.services.password.bcrypt));
		if (!reqPass) {
			return instance.save();
		}
		swal({
			title: t('Please_enter_your_password'),
			text: t('For_your_security_you_must_enter_your_current_password_to_continue'),
			type: 'input',
			inputType: 'password',
			showCancelButton: true,
			closeOnConfirm: false,
			confirmButtonText: t('Save'),
			cancelButtonText: t('Cancel')
		}, (typedPassword) => {
			if (typedPassword) {
				toastr.remove();
				toastr.warning(t('Please_wait_while_your_profile_is_being_saved'));
				instance.save(SHA256(typedPassword));
			} else {
				swal.showInputError(t('You_need_to_type_in_your_password_in_order_to_do_this'));
				return false;
			}
		});
	},
	'click .logoutOthers button'() {
		Meteor.logoutOtherClients(function(error) {
			if (error) {
				toastr.remove();
				handleError(error);
			} else {
				toastr.remove();
				toastr.success(t('Logged_out_of_other_clients_successfully'));
			}
		});
	},
	'click .delete-account button'(e) {
		e.preventDefault();
		const user = Meteor.user();
		if (s.trim(user && user.services && user.services.password && user.services.password.bcrypt)) {
			swal({
				title: t('Are_you_sure_you_want_to_delete_your_account'),
				text: t('If_you_are_sure_type_in_your_password'),
				type: 'input',
				inputType: 'password',
				showCancelButton: true,
				closeOnConfirm: false,
				confirmButtonText: t('Delete'),
				cancelButtonText: t('Cancel')
			}, (typedPassword) => {
				if (typedPassword) {
					toastr.remove();
					toastr.warning(t('Please_wait_while_your_account_is_being_deleted'));
					Meteor.call('deleteUserOwnAccount', SHA256(typedPassword), function(error) {
						if (error) {
							toastr.remove();
							swal.showInputError(t('Your_password_is_wrong'));
						} else {
							swal.close();
						}
					});
				} else {
					swal.showInputError(t('You_need_to_type_in_your_password_in_order_to_do_this'));
					return false;
				}
			});
		} else {
			swal({
				title: t('Are_you_sure_you_want_to_delete_your_account'),
				text: t('If_you_are_sure_type_in_your_username'),
				type: 'input',
				showCancelButton: true,
				closeOnConfirm: false,
				confirmButtonText: t('Delete'),
				cancelButtonText: t('Cancel')
			}, (deleteConfirmation) => {
				const user = Meteor.user();
				if (deleteConfirmation === (user && user.username)) {
					toastr.remove();
					toastr.warning(t('Please_wait_while_your_account_is_being_deleted'));
					Meteor.call('deleteUserOwnAccount', deleteConfirmation, function(error) {
						if (error) {
							toastr.remove();
							swal.showInputError(t('Your_password_is_wrong'));
						} else {
							swal.close();
						}
					});
				} else {
					swal.showInputError(t('You_need_to_type_in_your_username_in_order_to_do_this'));
					return false;
				}
			});
		}
	},
	'click #resend-verification-email'(e) {
		const user = Meteor.user();
		e.preventDefault();
		e.currentTarget.innerHTML = `${ e.currentTarget.innerHTML } ...`;
		e.currentTarget.disabled = true;
		Meteor.call('sendConfirmationEmail', user.emails && user.emails[0] && user.emails[0].address, (error, results) => {
			if (results) {
				toastr.success(t('Verification_email_sent'));
			} else if (error) {
				handleError(error);
			}
			e.currentTarget.innerHTML = e.currentTarget.innerHTML.replace(' ...', '');
			return e.currentTarget.disabled = false;
		});
	}
});
