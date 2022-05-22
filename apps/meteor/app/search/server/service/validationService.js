import { Meteor } from 'meteor/meteor';
import mem from 'mem';

import SearchLogger from '../logger/logger';
import { canAccessRoom } from '../../../authorization/server';
import { Users, Rooms } from '../../../models/server';

class ValidationService {
	validateSearchResult(result) {
		const getSubscription = mem((rid, uid) => {
			if (!rid) {
				return;
			}

			const room = Rooms.findOneById(rid);
			if (!room) {
				return;
			}

			if (!canAccessRoom(room, { _id: uid })) {
				return;
			}

			return room;
		});

		const getUser = mem((uid) => {
			if (!uid) {
				return;
			}
			return Users.findOneById(uid, { fields: { username: 1 } });
		});

		const uid = Meteor.userId();
		// get subscription for message
		if (result.message) {
			result.message.docs.forEach((msg) => {
				const user = getUser(msg.user);
				const subscription = getSubscription(msg.rid, uid);

				if (subscription) {
					msg.r = { name: subscription.name, t: subscription.t };
					msg.username = user?.username;
					msg.valid = true;
					SearchLogger.debug(`user ${uid} can access ${msg.rid} ( ${subscription.t === 'd' ? subscription.username : subscription.name} )`);
				} else {
					SearchLogger.debug(`user ${uid} can NOT access ${msg.rid}`);
				}
			});

			result.message.docs = result.message.docs.filter((msg) => msg.valid);
		}

		if (result.room) {
			result.room.docs.forEach((room) => {
				const subscription = getSubscription(room._id, uid);
				if (subscription) {
					room.valid = true;
					room.t = subscription.t;
					room.name = subscription.name;
					SearchLogger.debug(
						`user ${uid} can access ${room._id} ( ${subscription.t === 'd' ? subscription.username : subscription.name} )`,
					);
				} else {
					SearchLogger.debug(`user ${uid} can NOT access ${room._id}`);
				}
			});

			result.room.docs = result.room.docs.filter((room) => room.valid);
		}

		return result;
	}
}

export const validationService = new ValidationService();
