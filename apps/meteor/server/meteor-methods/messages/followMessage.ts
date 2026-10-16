import { Apps, AppEvents } from '@rocket.chat/apps';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RateLimiterClass as RateLimiter } from '../../lib/RateLimiter';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { follow } from '../../lib/messaging/threads/functions';
import { notifyOnMessageChange } from '../../lib/notifyListener';
import { settings } from '../../settings';

export const followMessage = async (user: IUser, { mid }: { mid: IMessage['_id'] }): Promise<false | undefined> => {
	if (mid && !settings.get('Threads_enabled')) {
		throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followMessage' });
	}

	const message = await Messages.findOneById(mid);
	if (!message) {
		throw new Meteor.Error('error-invalid-message', 'Invalid message', {
			method: 'followMessage',
		});
	}

	if (!(await canAccessRoomIdAsync(message.rid, user._id))) {
		throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followMessage' });
	}

	const id = message.tmid || message._id;

	const followResult = await follow({ tmid: id, uid: user._id });

	void notifyOnMessageChange({
		id,
	});

	const isFollowed = true;
	await Apps.self?.triggerEvent(AppEvents.IPostMessageFollowed, message, user, isFollowed);

	return followResult;
};

RateLimiter.limitMethod('followMessage', 5, 5000, {
	userId() {
		return true;
	},
});
