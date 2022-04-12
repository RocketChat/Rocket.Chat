import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages } from '../../app/models/server';
import { Reports, Rooms } from '../../app/models/server/raw';
import { canAccessRoomAsync } from '../../app/authorization/server/functions/canAccessRoom';

Meteor.methods({
	async reportMessage(messageId, description) {
		check(messageId, String);
		check(description, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'reportMessage',
			});
		}

		if (description == null || description.trim() === '') {
			throw new Meteor.Error('error-invalid-description', 'Invalid description', {
				method: 'reportMessage',
			});
		}

		const message = Messages.findOneById(messageId);
		if (!message) {
			throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
				method: 'reportMessage',
			});
		}

		const uid = Meteor.userId();
		const { rid } = message;
		// If the user can't access the room where the message is, report that the message id is invalid
		const room = await Rooms.findOneById(rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) {
			throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
				method: 'reportMessage',
			});
		}

		await Reports.createWithMessageDescriptionAndUserId(message, description, uid);

		return true;
	},
});
