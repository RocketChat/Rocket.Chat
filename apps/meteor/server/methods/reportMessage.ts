import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IMessage } from '@rocket.chat/core-typings';
import { ModerationReports, Rooms, Users, Messages } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../app/authorization/server/functions/canAccessRoom';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		reportMessage(messageId: IMessage['_id'], description: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async reportMessage(messageId, description) {
		methodDeprecationLogger.method('reportMessage', '7.0.0');

		check(messageId, String);
		check(description, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'reportMessage',
			});
		}

		const user = await Users.findOneById(uid);

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'reportMessage',
			});
		}

		if (description == null || description.trim() === '') {
			throw new Meteor.Error('error-invalid-description', 'Invalid description', {
				method: 'reportMessage',
			});
		}

		const message = await Messages.findOneById(messageId);
		if (!message) {
			throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
				method: 'reportMessage',
			});
		}

		const { rid } = message;
		// If the user can't access the room where the message is, report that the message id is invalid
		const room = await Rooms.findOneById(rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: user._id }))) {
			throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
				method: 'reportMessage',
			});
		}

		const reportedBy = {
			_id: user._id,
			username: user.username,
			name: user.name,
			createdAt: user.createdAt,
		};

		const roomInfo = {
			_id: rid,
			name: room.name,
			t: room.t,
			federated: room.federated,
			fname: room.fname,
		};

		await ModerationReports.createWithMessageDescriptionAndUserId(message, description, roomInfo, reportedBy);

		await Apps.self?.triggerEvent(AppEvents.IPostMessageReported, message, await Meteor.userAsync(), description);

		return true;
	},
});
