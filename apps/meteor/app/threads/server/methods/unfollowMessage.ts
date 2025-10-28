import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { RateLimiter } from '../../../lib/server';
import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { unfollow } from '../functions';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unfollowMessage(message: { mid: IMessage['_id'] }): false | undefined;
	}
}

export const unfollowMessage = async (userId: string, { mid }: { mid: IMessage['_id'] }): Promise<false | undefined> => {
	if (mid && !settings.get('Threads_enabled')) {
		throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'unfollowMessage' });
	}

	const message = await Messages.findOneById(mid);
	if (!message) {
		throw new Meteor.Error('error-invalid-message', 'Invalid message', {
			method: 'unfollowMessage',
		});
	}

	if (!(await canAccessRoomIdAsync(message.rid, userId))) {
		throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'unfollowMessage' });
	}

	const id = message.tmid || message._id;

	const unfollowResult = await unfollow({ rid: message.rid, tmid: id, uid: userId });

	void notifyOnMessageChange({
		id,
	});

	const isFollowed = false;
	await Apps.self?.triggerEvent(AppEvents.IPostMessageFollowed, message, await Meteor.userAsync(), isFollowed);

	return unfollowResult;
};

Meteor.methods<ServerMethods>({
	async unfollowMessage({ mid }) {
		check(mid, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unfollowMessage' });
		}

		return unfollowMessage(uid, { mid });
	},
});

RateLimiter.limitMethod('unfollowMessage', 5, 5000, {
	userId() {
		return true;
	},
});
