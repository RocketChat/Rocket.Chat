import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

Meteor.methods({ /* microservice */
	async createChannel(name, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(members, Match.Optional([String]));
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		if (!await RocketChat.Services.call('authorization.hasPermission', { uid, permission: 'create-c' })) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
		}

		return RocketChat.Services.call('core.createRoom', { type: 'c', name, members, readOnly, customFields, extraData, uid });
	},
});
