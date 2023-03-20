import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Reports, Rooms } from '@rocket.chat/models';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Messages } from '../../app/models/server';
import { canAccessRoomAsync } from '../../app/authorization/server/functions/canAccessRoom';
import { AppEvents, Apps } from '../../ee/server/apps';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		reportMessage(messageId: IMessage['_id'], description: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async reportMessage(messageId, description) {
		methodDeprecationLogger.warn('reportMessage is deprecated and will be removed in future versions of Rocket.Chat');

		check(messageId, String);
		check(description, String);

		const user = Meteor.user();

		if (!user._id) {
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
		if (!room || !(await canAccessRoomAsync(room, { _id: user._id }))) {
			throw new Meteor.Error('error-invalid-message_id', 'Invalid message id', {
				method: 'reportMessage',
			});
		}

		const reportedBy = {
			_id: user._id,
			username: user.username,
			name: user.name,
			active: user.active,
			avatarETag: user.avatarETag,
		};

		const roomInfo = {
			rid,
			name: room.name,
			t: room.t,
			federated: room.federated,
			fname: room.fname,
		};

		await Reports.createWithMessageDescriptionAndUserId(message, description, roomInfo, reportedBy);

		await Apps.triggerEvent(AppEvents.IPostMessageReported, message, Meteor.user(), description);

		return true;
	},
});
