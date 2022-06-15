import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages } from '../../../models/server';
import { RateLimiter } from '../../../lib/server';
import { settings } from '../../../settings/server';
import { canAccessRoomId } from '../../../authorization/server';
import { follow } from '../functions';
import { Apps, AppEvents } from '../../../apps/server/orchestrator';

Meteor.methods({
	followMessage({ mid }) {
		check(mid, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'followMessage' });
		}

		if (mid && !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followMessage' });
		}

		const message = Messages.findOneById(mid);
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'followMessage',
			});
		}

		if (!canAccessRoomId(message.rid, uid)) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed', { method: 'followMessage' });
		}

		const followResult = follow({ tmid: message.tmid || message._id, uid });

		const isFollowed = true;
		Promise.await(Apps.triggerEvent(AppEvents.IPostMessageFollowed, message, Meteor.user(), isFollowed));

		return followResult;
	},
});

RateLimiter.limitMethod('followMessage', 5, 5000, {
	userId() {
		return true;
	},
});
