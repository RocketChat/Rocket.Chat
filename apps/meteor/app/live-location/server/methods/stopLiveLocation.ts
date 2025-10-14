import { Messages, Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';

type Coords = { lat: number; lng: number; acc?: number };

Meteor.methods({
	/**
	 * Stop live location sharing
	 */
	async 'liveLocation.stop'(rid: string, msgId: string, finalCoords?: Coords) {
		check(rid, String);
		check(msgId, String);

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'liveLocation.stop' });
		}

		if (!(await canAccessRoomIdAsync(rid, uid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'liveLocation.stop' });
		}

		const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
		if (!sub) {
			throw new Meteor.Error('error-not-in-room', 'User is not in the room', { method: 'liveLocation.stop' });
		}

		const selector = {
			'_id': msgId,
			rid,
			'u._id': uid,
			'attachments': {
				$elemMatch: {
					'type': 'live-location',
					'live.isActive': true,
				},
			},
		};

		const modifier: any = {
			$set: {
				'attachments.0.live.isActive': false,
				'attachments.0.live.stoppedAt': new Date(),
			},
		};

		if (finalCoords) {
			modifier.$set['attachments.0.live.coords'] = finalCoords;
		}

		const res = await Messages.updateOne(selector, modifier);
		const success = Boolean(res.modifiedCount);

		if (success) {
			const updatedMsg = await Messages.findOneById(msgId);
			if (updatedMsg) {
				void notifyOnMessageChange({
					id: updatedMsg._id,
					data: updatedMsg,
				});
			}
		}

		return { stopped: success };
	},
});

DDPRateLimiter.addRule(
	{
		userId(userId: string) {
			return !!userId;
		},
		type: 'method',
		name: 'liveLocation.stop',
	},
	10,
	60000,
);
