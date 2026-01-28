import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
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

Meteor.methods<ServerMethods>({
	async unfollowMessage({ mid }) {
		check(mid, String);

		const user = (await Meteor.userAsync()) as IUser;
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'unfollowMessage' });
		}

		return unfollowMessage(user, { mid });
	},
});

RateLimiter.limitMethod('unfollowMessage', 5, 5000, {
	userId() {
		return true;
	},
});
