import { SHA256 } from 'meteor/sha';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

import { modal, SideNav } from '../../ui-utils';
import { t, handleError } from '../../utils';
import { settings } from '../../settings';
import { Notifications } from '../../notifications';
import { callbacks } from '../../callbacks';

const validateEmail = (email) => /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
const validateUsername = (username) => {
	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return reg.test(username);
};
const validateName = (name) => name && name.length;
const validateStatusMessage = (statusMessage) => {
	if (!statusMessage || statusMessage.length <= 120 || statusMessage.length === 0) {
		return true;
	}
};
const validatePassword = (password, confirmationPassword) => {
	if (!confirmationPassword) {
		return true;
	}

	return password === confirmationPassword;
};

const filterNames = (old) => {
	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '')].filter((f) => reg.test(f)).join('');
};
const filterEmail = (old) => old.replace(' ', '');

const setAvatar = function(event, template) {
	const { blob, contentType, service } = this.suggestion;

	template.avatar.set({
		service,
		contentType,
		blob,
	});
};
const loginWith = function(event, template) {
	const loginWithService = `loginWith${ s.capitalize(this.name) }`;
	const serviceConfig = {};
	Meteor[loginWithService](serviceConfig, function(error) {
		if (error && error.error) {
			if (error.error === 'github-no-public-email') {
				return alert(t('github_no_public_email'));
			}
			return toastr.error(error.message);
		}
		template.getSuggestions();
	});
};
const isUserEmailVerified = (user) => user.emails && user.emails[0] && user.emails[0].verified;
const getUserEmailAddress = (user) => user.emails && user.emails[0] && user.emails[0].address;

Template.accountProfile.helpers({
	emailInvalid() {
		return !validateEmail(Template.instance().email.get());
	},
	usernameInvalid() {
		return !validateUsername(Template.instance().username.get());
	},
	usernameAvaliable() {
		return Template.instance().usernameAvaliable.get() !== false;
	},
	nameInvalid() {
		return !validateName(Template.instance().realname.get());
	},
	statusMessageInvalid() {
		return !validateStatusMessage(Template.instance().statusText.get());
	},
	confirmationPasswordInvalid() {
		const { password, confirmationPassword } = Template.instance();
		return !validatePassword(password.get(), confirmationPassword.get());
	},
	selectUrl() {
		return Template.instance().url.get().trim() ? '' : 'disabled';
	},
	services() {
		const suggestions = Template.instance().suggestions.get();

		if (suggestions.avatars) {
			return Object.keys(suggestions.avatars).map((service) => ({
				name: service,
				// TODO: improve this fix
				service: !suggestions.avatars[service.toLowerCase()] ? settings.get(`Accounts_OAuth_${ s.capitalize(service.toLowerCase()) }`) : false,
				suggestion: suggestions.avatars[service.toLowerCase()],
			}))
				.filter(({ service, suggestion }) => service || suggestion);
		}
	},
	initialsUsername() {
		const user = Meteor.user();
		return `@${ user && user.username }`;
	},
	avatarPreview() {
		return Template.instance().avatar.get();
	},
	suggestions() {
		return Template.instance().suggestions.get();
	},
	ifThenElse(condition, val, not = '') {
		return condition ? val : not;
	},
	canSave(ret) {
		const instance = Template.instance();
		instance.dep.depend();
		const realname = instance.realname.get();
		const statusText = instance.statusText.get();
		const username = instance.username.get();
		const password = instance.password.get();
		const confirmationPassword = instance.confirmationPassword.get();
		const email = instance.email.get();
		const usernameAvaliable = instance.usernameAvaliable.get();
		const avatar = instance.avatar.get();
		const user = Meteor.user();
		const { customFields = {} } = user;
		if (instance.view.isRendered) {
			if (instance.findAll('[data-customfield="true"]').some((el) => {
				const key = el.getAttribute('name');
				const value = customFields[key] || '';
				return el.value !== value;
			})) {
				return;
			}
		}
		if (!avatar && user.name === realname && user.username === username && (!!user.u || getUserEmailAddress(user) === email === email) && (!password || password !== confirmationPassword)) {
			return ret;
		}
		if ((!validateEmail(email) && !user.u) || (!validateUsername(username) || usernameAvaliable !== true) || !validateName(realname) || !validateStatusMessage(statusText)) {
			return ret;
		}
	},
	allowDeleteOwnAccount() {
		return settings.get('Accounts_AllowDeleteOwnAccount');
	},
	realname() {
		return Meteor.user().name;
	},
	username() {
		return Meteor.user().username;
	},
	statusText() {
		return Meteor.user().statusText;
	},
	email() {
		const user = Meteor.user();
		return getUserEmailAddress(user);
	},
	emailVerified() {
		const user = Meteor.user();
		return isUserEmailVerified(user);
	},
	allowRealNameChange() {
		return settings.get('Accounts_AllowRealNameChange');
	},
	allowStatusMessageChange() {
		return settings.get('Accounts_AllowUserStatusMessageChange');
	},
	allowUsernameChange() {
		return settings.get('Accounts_AllowUsernameChange') && settings.get('LDAP_Enable') !== true;
	},
	allowEmailChange() {
		return settings.get('Accounts_AllowEmailChange');
	},
	allowPasswordChange() {
		return settings.get('Accounts_AllowPasswordChange');
	},
	canConfirmNewPassword() {
		const password = Template.instance().password.get();
		return settings.get('Accounts_AllowPasswordChange') && password && password !== '';
	},
	allowAvatarChange() {
		return settings.get('Accounts_AllowUserAvatarChange');
	},
	customFields() {
		return Meteor.user().customFields;
	},
});

Template.accountProfile.onCreated(function() {
	const self = this;
	const user = Meteor.user();
	self.dep = new Tracker.Dependency();
	self.realname = new ReactiveVar(user.name);
	self.email = new ReactiveVar(getUserEmailAddress(user));
	self.username = new ReactiveVar(user.username);
	self.password = new ReactiveVar();
	self.confirmationPassword = new ReactiveVar();
	self.suggestions = new ReactiveVar();
	self.avatar = new ReactiveVar();
	self.url = new ReactiveVar('');
	self.usernameAvaliable = new ReactiveVar(true);
	self.statusText = new ReactiveVar(user.statusText);

	Notifications.onLogged('updateAvatar', () => self.avatar.set());
	self.getSuggestions = function() {
		self.suggestions.set(undefined);
		Meteor.call('getAvatarSuggestion', function(error, avatars) {
			self.suggestions.set({ ready: true, avatars });
		});
	};
	self.getSuggestions();
	const settingsTemplate = this.parentTemplate(3);
	if (settingsTemplate.child == null) {
		settingsTemplate.child = [];
	}
	settingsTemplate.child.push(this);
	this.clearForm = function() {
		this.find('[name=password]').value = '';
	};
	this.changePassword = function(newPassword, callback) {
		const instance = this;
		if (!newPassword) {
			return callback();
		} if (!settings.get('Accounts_AllowPasswordChange')) {
			toastr.remove();
			toastr.error(t('Password_Change_Disabled'));
			instance.clearForm();
		}
	};
	this.save = function(typedPassword, cb) {
		const avatar = self.avatar.get();
		if (avatar) {
			const params = [avatar.blob];

			params.push(avatar.contentType);

			params.push(avatar.service);
			Meteor.call('setAvatarFromService', ...params, function(err) {
				if (err && err.details && err.details.timeToReset) {
					toastr.error(t('error-too-many-requests', {
						seconds: parseInt(err.details.timeToReset / 1000),
					}));
				} else {
					toastr.success(t('Avatar_changed_successfully'));
					callbacks.run('userAvatarSet', avatar.service);
				}
			});
		}
		const instance = this;
		const data = {};
		const user = Meteor.user();
		if (typedPassword) {
			data.typedPassword = typedPassword;
		}
		if (s.trim(self.password.get()) && settings.get('Accounts_AllowPasswordChange')) {
			data.newPassword = self.password.get();
		}
		if (s.trim(self.realname.get()) !== user.name) {
			if (!settings.get('Accounts_AllowRealNameChange')) {
				toastr.remove();
				toastr.error(t('RealName_Change_Disabled'));
				instance.clearForm();
				return cb && cb();
			}
			data.realname = s.trim(self.realname.get());
		}
		if (s.trim(self.statusText.get()) !== user.statusText) {
			if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
				toastr.remove();
				toastr.error(t('StatusMessage_Change_Disabled'));
				instance.clearForm();
				return cb && cb();
			}

			data.statusText = s.trim(self.statusText.get());
		}
		if (s.trim(self.username.get()) !== user.username) {
			if (!settings.get('Accounts_AllowUsernameChange')) {
				toastr.remove();
				toastr.error(t('Username_Change_Disabled'));
				instance.clearForm();
				return cb && cb();
			}
			data.username = s.trim(self.username.get());
		}
		if (s.trim(self.email.get()) !== getUserEmailAddress(user)) {
			if (!settings.get('Accounts_AllowEmailChange')) {
				toastr.remove();
				toastr.error(t('Email_Change_Disabled'));
				instance.clearForm();
				return cb && cb();
			}
			data.email = s.trim(self.email.get());
		}
		const customFields = {};
		$('[data-customfield=true]').each(function() {
			customFields[this.name] = $(this).val() || '';
		});

		if (Object.keys(data).length + Object.keys(customFields).length === 0) {
			return cb && cb();
		}
		Meteor.call('saveUserProfile', data, customFields, function(error, results) {
			cb && cb();
			if (results) {
				toastr.remove();
				toastr.success(t('Profile_saved_successfully'));
				modal.close();
				instance.clearForm();
				self.password.set();
			}
			if (error) {
				toastr.remove();
				handleError(error);
			}
		});
	};
});

Template.accountProfile.onRendered(function() {
	Tracker.afterFlush(() => {
		if (!settings.get('Accounts_AllowUserProfileChange')) {
			FlowRouter.go('home');
		}
		this.clearForm();
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});

const checkAvailability = _.debounce((username, { usernameAvaliable }) => {
	Meteor.call('checkUsernameAvailability', username, function(error, data) {
		usernameAvaliable.set(data);
	});
}, 300);

Template.accountProfile.events({
	'change [data-customfield="true"], input [data-customfield="true"]': _.debounce((e, i) => {
		i.dep.changed();
	}, 300),
	'click .js-select-avatar-initials'() {
		Meteor.call('resetAvatar', function(err) {
			if (err && err.details && err.details.timeToReset) {
				toastr.error(t('error-too-many-requests', {
					seconds: parseInt(err.details.timeToReset / 1000),
				}));
			} else {
				toastr.success(t('Avatar_changed_successfully'));
				callbacks.run('userAvatarSet', 'initials');
			}
		});
	},
	'click .js-select-avatar-url'(e, instance, ...args) {
		const url = instance.url.get().trim();
		if (!url) {
			return;
		}
		setAvatar.apply({
			suggestion: {
				service: 'url',
				blob: url,
				contentType: '',
			},
		}, [e, instance, ...args]);
	},
	'input .js-avatar-url-input'(e, instance) {
		const text = e.target.value;
		instance.url.set(text);
	},
	'click .js-select-avatar'(...args) {
		this.suggestion ? setAvatar.apply(this, args) : loginWith.apply(this, args);
	},
	'input [name=email]'(e, instance) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		const modified = filterEmail(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		instance.email.set(modified);
	},
	'input [name=username]'(e, instance) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		instance.username.set(modified);
		instance.usernameAvaliable.set();
		checkAvailability(modified, instance);
	},
	'input [name=realname]'(e, instance) {
		instance.realname.set(e.target.value);
	},
	'input [name=statusText]'(e, instance) {
		instance.statusText.set(e.target.value);
	},
	'input [name=password]'(e, instance) {
		instance.password.set(e.target.value);

		if (e.target.value.length === 0) {
			instance.confirmationPassword.set('');
		}
	},
	'input [name=confirmation-password]'(e, instance) {
		instance.confirmationPassword.set(e.target.value);
	},
	'submit form'(e, instance) {
		e.preventDefault();
		const user = Meteor.user();
		const email = instance.email.get();
		const password = instance.password.get();

		const send = $(e.target.send);
		send.addClass('loading');
		const reqPass = ((email !== getUserEmailAddress(user))
			|| s.trim(password)) && (user && user.services && user.services.password && s.trim(user.services.password.bcrypt));
		if (!reqPass) {
			return instance.save(undefined, () => setTimeout(() => send.removeClass('loading'), 1000));
		}
		modal.open({
			title: t('Please_enter_your_password'),
			text: t('For_your_security_you_must_enter_your_current_password_to_continue'),
			type: 'input',
			inputType: 'password',
			showCancelButton: true,
			closeOnConfirm: false,
			confirmButtonText: t('Save'),
			cancelButtonText: t('Cancel'),
		}, (typedPassword) => {
			if (typedPassword) {
				toastr.remove();
				toastr.warning(t('Please_wait_while_your_profile_is_being_saved'));
				instance.save(SHA256(typedPassword), () => send.removeClass('loading'));
			} else {
				modal.showInputError(t('You_need_to_type_in_your_password_in_order_to_do_this'));
				return false;
			}
		});
	},
	'click .js-logout'(e) {
		e.preventDefault();
		$(e.target).addClass('loading');
		Meteor.logoutOtherClients(function(error) {
			setTimeout(function functionName() {
				if (error) {
					toastr.remove();
					handleError(error);
				} else {
					toastr.remove();
					toastr.success(t('Logged_out_of_other_clients_successfully'));
				}

				$(e.target).removeClass('loading');
			}, 1000);
		});
	},
	'click .js-delete-account'(e) {
		e.preventDefault();
		const user = Meteor.user();
		if (s.trim(user && user.services && user.services.password && user.services.password.bcrypt)) {
			modal.open({
				title: t('Are_you_sure_you_want_to_delete_your_account'),
				text: t('If_you_are_sure_type_in_your_password'),
				type: 'input',
				inputType: 'password',
				showCancelButton: true,
				closeOnConfirm: false,
				confirmButtonText: t('Delete'),
				cancelButtonText: t('Cancel'),
			}, (typedPassword) => {
				if (typedPassword) {
					toastr.remove();
					toastr.warning(t('Please_wait_while_your_account_is_being_deleted'));
					Meteor.call('deleteUserOwnAccount', SHA256(typedPassword), function(error) {
						if (error) {
							toastr.remove();
							modal.showInputError(t('Your_password_is_wrong'));
						} else {
							modal.close();
						}
					});
				} else {
					modal.showInputError(t('You_need_to_type_in_your_password_in_order_to_do_this'));
					return false;
				}
			});
		} else {
			modal.open({
				title: t('Are_you_sure_you_want_to_delete_your_account'),
				text: t('If_you_are_sure_type_in_your_username'),
				type: 'input',
				showCancelButton: true,
				closeOnConfirm: false,
				confirmButtonText: t('Delete'),
				cancelButtonText: t('Cancel'),
			}, (deleteConfirmation) => {
				const user = Meteor.user();
				if (deleteConfirmation === (user && user.username)) {
					toastr.remove();
					toastr.warning(t('Please_wait_while_your_account_is_being_deleted'));
					Meteor.call('deleteUserOwnAccount', deleteConfirmation, function(error) {
						if (error) {
							toastr.remove();
							modal.showInputError(t('Your_password_is_wrong'));
						} else {
							modal.close();
						}
					});
				} else {
					modal.showInputError(t('You_need_to_type_in_your_username_in_order_to_do_this'));
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
		Meteor.call('sendConfirmationEmail', getUserEmailAddress(user), (error, results) => {
			if (results) {
				toastr.success(t('Verification_email_sent'));
			} else if (error) {
				handleError(error);
			}
			e.currentTarget.innerHTML = e.currentTarget.innerHTML.replace(' ...', '');
			e.currentTarget.disabled = false;
		});
	},
	'change .js-select-avatar-upload [type=file]'(event, template) {
		const e = event.originalEvent || event;
		let { files } = e.target;
		if (!files || files.length === 0) {
			files = (e.dataTransfer && e.dataTransfer.files) || [];
		}
		Object.keys(files).forEach((key) => {
			const blob = files[key];
			if (!/image\/.+/.test(blob.type)) {
				return;
			}
			const reader = new FileReader();
			reader.readAsDataURL(blob);
			reader.onloadend = function() {
				template.avatar.set({
					service: 'upload',
					contentType: blob.type,
					blob: reader.result,
				});
				callbacks.run('userAvatarSet', 'upload');
			};
		});
	},

});
