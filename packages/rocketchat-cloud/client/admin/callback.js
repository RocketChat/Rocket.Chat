import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import queryString from 'query-string';

Template.cloudCallback.onCreated(function() {
	const instance = this;

	instance.loading = new ReactiveVar(true);
	instance.callbackError = new ReactiveVar({ error: false });

	const params = queryString.parse(location.search);

	console.log('THe query params:', params);

	if (params.error_code) {
		instance.callbackError.set({ error: true, errorCode: params.error_code });
	} else {
		console.log('calling finish oAuth');
		Meteor.call('cloud:finishOAuthAuthorization', params.code, params.state, (error, result) => {
			if (error) {
				console.warn('cloud:finishOAuthAuthorization', error);
				return;
			}

			instance.loading.set(false);
			console.log(result);
		});
	}
});

Template.cloudCallback.helpers({
	callbackError() {
		return Template.instance().callbackError.get();
	},
});
