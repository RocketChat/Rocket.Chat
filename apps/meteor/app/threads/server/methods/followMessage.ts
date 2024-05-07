import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { RateLimiter } from '../../../lib/server';
import { settings } from '../../../settings/server';
import { follow } from '../functions';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		followMessage(message: { mid: IMessage['_id'] }): false | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async followMessage({ mid }) {
		check(mid, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'followMessage' });
		}

		if (mid && !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followMessage' });
		}

		const message = await Messages.findOneById(mid);
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'followMessage',
			});
		}

		if (!(await canAccessRoomIdAsync(message.rid, uid))) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followMessage' });
		}

		const followResult = await follow({ tmid: message.tmid || message._id, uid });

		const isFollowed = true;
		await Apps.self?.triggerEvent(AppEvents.IPostMessageFollowed, message, await Meteor.userAsync(), isFollowed);

		return followResult;
	},
});

RateLimiter.limitMethod('followMessage', 5, 5000, {
	userId() {
		return true;
	},
});
