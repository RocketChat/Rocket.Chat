import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { saveUser } from '../functions';

Meteor.methods({
	insertOrUpdateUser(userData) {
		check(userData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateUser' });
		}

		return saveUser(Meteor.userId(), userData);
	},
});
