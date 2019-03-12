import './callback.html';

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { FlowRouter } from 'meteor/kadira:flow-router';

import queryString from 'query-string';

Template.cloudCallback.onCreated(function() {
	const instance = this;

	instance.loading = new ReactiveVar(true);
	instance.callbackError = new ReactiveVar({ error: false });

	const params = queryString.parse(location.search);

	if (params.error_code) {
		instance.callbackError.set({ error: true, errorCode: params.error_code });
	} else {
		Meteor.call('cloud:finishOAuthAuthorization', params.code, params.state, (error) => {
			if (error) {
				console.warn('cloud:finishOAuthAuthorization', error);
				return;
			}

			FlowRouter.go('/admin/cloud');
		});
	}
});

Template.cloudCallback.helpers({
	callbackError() {
		return Template.instance().callbackError.get();
	},
});
