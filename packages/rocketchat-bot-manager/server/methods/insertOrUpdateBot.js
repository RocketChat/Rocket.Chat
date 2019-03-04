import { Meteor } from 'meteor/meteor';
import { saveBot } from '../functions/saveBot';

Meteor.methods({
	insertOrUpdateBot(botData) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'insertOrUpdateBot' });
		}

		if (!botData) {
			throw new Meteor.Error('error-missing-data', 'Missing data', { method: 'insertOrUpdateBot' });
		}

		return saveBot(Meteor.userId(), botData);
	},
});
