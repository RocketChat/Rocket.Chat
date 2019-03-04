import { Meteor } from 'meteor/meteor';
import { setCustomClientData } from '../functions/setCustomClientData';

Meteor.methods({
	setCustomClientData(clientData) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setCustomClientData' });
		}

		if (!clientData) {
			throw new Meteor.Error('error-missing-data', 'Missing data', { method: 'insertOrUpdateBot' });
		}

		const user = Meteor.user();

		clientData.ipAddress = this.connection.clientAddress;

		return setCustomClientData(user, clientData);
	},
});
