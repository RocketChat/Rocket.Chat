import toastr from 'toastr';
Template.avatarPrompt.onCreated(function() {
	const self = this;
	self.suggestions = new ReactiveVar;
	self.upload = new ReactiveVar;
	self.getSuggestions = function() {
		self.suggestions.set(undefined);
		return Meteor.call('getAvatarSuggestion', function(error, avatars) {
			return self.suggestions.set({
				ready: true,
				avatars
			});
		});
	};
	return self.getSuggestions();
});

Template.avatarPrompt.onRendered(function() {
	return Tracker.afterFlush(function() {
		if (!RocketChat.settings.get('Accounts_AllowUserAvatarChange')) {
			FlowRouter.go('home');
		}
		SideNav.setFlex('accountFlex');
		return SideNav.openFlex();
	});
});

Template.avatarPrompt.helpers({
	suggestions() {
		return Template.instance().suggestions.get();
	},
	suggestAvatar(service) {
		const suggestions = Template.instance().suggestions.get();
		return RocketChat.settings.get(`Accounts_OAuth_${ _.capitalize(service) }`) && !suggestions.avatars[service];
	},
	upload() {
		return Template.instance().upload.get();
	},
	username() {
		const user = Meteor.user();
		return user && user.username;
	},
	initialsUsername() {
		const user = Meteor.user();
		return `@${ user && user.username }`;
	}
});

Template.avatarPrompt.events({
	'click .select-service'() {
		let tmpService;
		if (this.service === 'initials') {
			return Meteor.call('resetAvatar', function(err) {
				if (err && err.details.timeToReset && err.details.timeToReset) {
					return toastr.error(t('error-too-many-requests', {
						seconds: parseInt(err.details.timeToReset / 1000)
					}));
				} else {
					toastr.success(t('Avatar_changed_successfully'));
					return RocketChat.callbacks.run('userAvatarSet', 'initials');
				}
			});
		} else if (this.service === 'url') {
			if (_.trim($('#avatarurl').val())) {
				return Meteor.call('setAvatarFromService', $('#avatarurl').val(), '', this.service, function(err) {
					if (err) {
						if (err.details.timeToReset && err.details.timeToReset) {
							return toastr.error(t('error-too-many-requests', {
								seconds: parseInt(err.details.timeToReset / 1000)
							}));
						} else {
							return toastr.error(t('Avatar_url_invalid_or_error'));
						}
					} else {
						toastr.success(t('Avatar_changed_successfully'));
						return RocketChat.callbacks.run('userAvatarSet', 'url');
					}
				});
			} else {
				return toastr.error(t('Please_enter_value_for_url'));
			}
		} else {
			tmpService = this.service;
			return Meteor.call('setAvatarFromService', this.blob, this.contentType, this.service, function(err) {
				if (err && err.details.timeToReset && err.details.timeToReset) {
					return toastr.error(t('error-too-many-requests', {
						seconds: parseInt(err.details.timeToReset / 1000)
					}));
				} else {
					toastr.success(t('Avatar_changed_successfully'));
					return RocketChat.callbacks.run('userAvatarSet', tmpService);
				}
			});
		}
	},
	'click .login-with-service'(event, template) {
		const loginWithService = `loginWith${ _.capitalize(this) }`;
		const serviceConfig = {};
		return Meteor[loginWithService](serviceConfig, function(error) {
			if (error && error.error) {
				if (error.error === 'github-no-public-email') {
					return alert(t('github_no_public_email'));
				}
				console.log(error);
				return toastr.error(error.message);
			}
			return template.getSuggestions();
		});
	},
	'change .avatar-file-input'(event, template) {
		const e = event.originalEvent || event;
		let files = e.target.files;
		if (!files || files.length === 0) {
			files = (e.dataTransfer && e.dataTransfer.files) || [];
		}
		console.log(files);
		Object.keys(files).forEach((key) => {
			const blob = files[key];
			if (!/image\/.+/.test(blob.type)) {
				return;
			}
			const reader = new FileReader();
			reader.readAsDataURL(blob);
			reader.onloadend = function() {
				template.upload.set({
					service: 'upload',
					contentType: blob.type,
					blob: reader.result
				});
				return RocketChat.callbacks.run('userAvatarSet', 'upload');
			};
		});
	}
});
