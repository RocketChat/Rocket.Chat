import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import toastr from 'toastr';

Template.cloud.onCreated(function() {
	const instance = this;
	instance.info = new ReactiveVar();
	instance.loading = new ReactiveVar(true);

	Meteor.call('cloud:retrieveRegistrationInfo', (error, info) => {
		if (error) {
			console.warn('cloud:retrieveRegistrationInfo', error);
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

	'click .connect-btn'() {
		const token = $('input[name=cloudToken]').val();

		Meteor.call('cloud:connectServer', token, (error, data) => {
			if (error) {
				console.warn(error);
				return;
			}

			console.log('connect result:', data);
			window.open(data.url, 'cloudConnect');
		});
	},
});
