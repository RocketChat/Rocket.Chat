import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../../authorization/server';
import { translateMessage } from '../functions/translateMessage';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.translateMessage'(message: IMessage | undefined, targetLanguage: string): Promise<IMessage | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async 'autoTranslate.translateMessage'(message, targetLanguage) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'autoTranslate.translateMessage',
			});
		}
		check(message?._id, String);
		check(targetLanguage, String);
		const msg = await Messages.findOneById(message._id);
		if (!msg) {
			throw new Meteor.Error('error-message-not-found', 'Message not found');
		}
		const room = await Rooms.findOneById(msg.rid);
		if (!room || !(await canAccessRoomAsync(room, { _id: userId }))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}
		return translateMessage(targetLanguage, msg);
	},
});
