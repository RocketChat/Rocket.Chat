import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import toastr from 'toastr';

Template.cloud.onCreated(function() {
	const instance = this;
	instance.info = new ReactiveVar();
	instance.loading = new ReactiveVar(true);

	Meteor.call('cloud:checkRegisterStatus', (error, info) => {
		if (error) {
			console.warn('cloud:checkRegisterStatus', error);
			return;
		}

		instance.info.set(info);
		instance.loading.set(false);
		console.log(info);
	});
});

Template.cloud.helpers({
	info() {
		return Template.instance().info.get();
	},
});

Template.cloud.events({
	'click .update-email-btn'() {
		const val = $('input[name=cloudEmail]').val();

		Meteor.call('cloud:updateEmail', val, (error) => {
			if (error) {
				console.warn(error);
				return;
			}

			toastr.success(t('Saved'));
		});
	},

	'click .login-btn'() {
		Meteor.call('cloud:getOAuthAuthorizationUrl', (error, url) => {
			if (error) {
				console.warn(error);
				return;
			}

			console.log(url);
			window.location.href = url;
		});
	},

	'click .connect-btn'(e, i) {
		const token = $('input[name=cloudToken]').val();

		Meteor.call('cloud:connectWorkspace', token, (error) => {
			if (error) {
				console.warn(error);
				toastr.error(error);
				return;
			}

			toastr.success(t('Connected'));

			const info = i.info.get();
			info.workspaceConnected = true;

			i.info.set(info);
		});
	},
});
