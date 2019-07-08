import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

Meteor.methods({
	createMiniAppMessage({ roomId, msgData = {} }) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'miniAppMessage' });
		}

		const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

		if (!room) { return false; }

		const msg = {
			...msgData,
			_id: Random.id(),
			rid: roomId,
			ts: new Date(),
			msg: 'mini-app-created',
			groupable: false,
			t: 'mini-app-created',
		};

		return msg;
	},
});
