import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models/server';

Meteor.methods({
	updateOTRAck(_id: IMessage['_id'], ack: IMessage['otrAck']): void {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateOTRAck' });
		}
		Messages.updateOTRAck(_id, ack);
	},
});
