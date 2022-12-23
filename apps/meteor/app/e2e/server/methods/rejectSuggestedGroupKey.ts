import { Meteor } from 'meteor/meteor';

import { handleSuggestedGroupKey } from '../functions/handleSuggestedGroupKey';

const method = 'e2e.rejectSuggestedGroupKey';

Meteor.methods({
	async [method](rid) {
		return handleSuggestedGroupKey('reject', rid, Meteor.userId(), method);
	},
});
