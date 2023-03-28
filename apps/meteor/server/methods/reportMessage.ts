import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Reports, Rooms } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Messages } from '../../app/models/server';
import { canAccessRoomAsync } from '../../app/authorization/server/functions/canAccessRoom';
import { AppEvents, Apps } from '../../ee/server/apps';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		reportMessage(messageId: IMessage['_id'], description: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async reportMessage(messageId, description) {
		check(messageId, String);
		check(description, String);

		const uid = Meteor.userId();

		if (!uid) {
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

		const { rid } = message;
		// If the user can't access the room where the message is, report that the message id is invalid
		const room = await Rooms.findOneById(rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: uid }))) {
			throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
				method: 'reportMessage',
			});
		}

		await Reports.createWithMessageDescriptionAndUserId(message, description, uid);

		await Apps.triggerEvent(AppEvents.IPostMessageReported, message, await Meteor.userAsync(), description);

		return true;
	},
});
