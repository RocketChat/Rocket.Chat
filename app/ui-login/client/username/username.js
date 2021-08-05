import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import _ from 'underscore';

import { settings } from '../../../settings';
import { Button } from '../../../ui';
import { callbacks } from '../../../callbacks';

Template.username.onCreated(function() {
	const self = this;
	self.username = new ReactiveVar();

	return Meteor.call('getUsernameSuggestion', function(error, username) {
		self.username.set({
			ready: true,
			username,
		});
		return Meteor.defer(() => self.find('input').focus());
	});
});

Template.username.helpers({
	username() {
		return Template.instance().username.get();
	},

	backgroundUrl() {
		const asset = settings.get('Assets_background');
		const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset && (asset.url || asset.defaultUrl)) {
			return `${ prefix }/${ asset.url || asset.defaultUrl }`;
		}
	},
});

Template.username.events({
	'focus .input-text input'(event) {
		return $(event.currentTarget).parents('.input-text').addClass('focus');
	},

	'blur .input-text input'(event) {
		if (event.currentTarget.value === '') {
			return $(event.currentTarget).parents('.input-text').removeClass('focus');
		}
	},
	'reset #login-card'() {
		Meteor.logout();
	},
	'submit #login-card'(event, instance) {
		event.preventDefault();

		const username = instance.username.get();
		username.empty = false;
		username.error = false;
		username.invalid = false;
		instance.username.set(username);

		const button = $(event.target).find('button.login');
		Button.loading(button);

		const value = $('#username').val().trim();
		if (value === '') {
			username.empty = true;
			instance.username.set(username);
			Button.reset(button);
			return;
		}

		return Meteor.call('setUsername', value, function(err) {
			if (err != null) {
				if (err.error === 'username-invalid') {
					username.invalid = true;
				} else if (err.error === 'error-blocked-username') {
					username.blocked = true;
				} else {
					username.unavailable = true;
				}
				username.username = value;
				username.escaped = _.escape(value);
			}

			Button.reset(button);
			instance.username.set(username);
			return callbacks.run('usernameSet');
		});
	},
});
