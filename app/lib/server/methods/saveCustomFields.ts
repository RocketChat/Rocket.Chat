import { Meteor } from 'meteor/meteor';

import { RateLimiter } from '../lib';
import { saveCustomFields } from '../functions/saveCustomFields';

Meteor.methods({
	saveCustomFields(fields = {}) {
		console.log('fields');
		console.log(fields);
		console.log('userId: ', Meteor.userId());
		saveCustomFields(Meteor.userId(), fields);
	},
});

RateLimiter.limitMethod('saveCustomFields', 1, 1000, {
	userId() { return true; },
});
