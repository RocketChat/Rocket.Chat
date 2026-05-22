import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RateLimiterClass as RateLimiter } from '../../lib/RateLimiter';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { unfollow } from '../../lib/messaging/threads/functions';
import { notifyOnMessageChange } from '../../lib/notifyListener';
import { settings } from '../../settings';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unfollowMessage(message: { mid: IMessage['_id'] }): false | undefined;
	}
}

export const unfollowMessage = async (user: IUser, { mid }: { mid: IMessage['_id'] }): Promise<false | undefined> => {
	if (mid && !settings.get('Threads_enabled')) {
		throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'unfollowMessage' });
	}

	const message = await Messages.findOneById(mid);
	if (!message) {
		throw new Meteor.Error('error-invalid-message', 'Invalid message', {
			method: 'unfollowMessage',
		});
	}

	if (!(await canAccessRoomIdAsync(message.rid, user._id))) {
		throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'unfollowMessage' });
	}

	const id = message.tmid || message._id;

	const unfollowResult = await unfollow({ rid: message.rid, tmid: id, uid: user._id });

	void notifyOnMessageChange({
		id,
	});

	const isFollowed = false;
	await Apps.self?.triggerEvent(AppEvents.IPostMessageFollowed, message, user, isFollowed);

	return unfollowResult;
};

RateLimiter.limitMethod('unfollowMessage', 5, 5000, {
	userId() {
		return true;
	},
});
