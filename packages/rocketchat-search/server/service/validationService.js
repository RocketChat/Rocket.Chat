import SearchLogger from '../logger/logger';

class ValidationService {
	constructor() {}

	validateSearchResult(result) {

		const subscriptionCache = {};

		const getSubscription = (rid, uid) => {
			if (!subscriptionCache.hasOwnProperty(rid)) {
				subscriptionCache[rid] = Meteor.call('canAccessRoom', rid, uid);
			}

			return subscriptionCache[rid];
		};

		const userCache = {};

		const getUsername = (uid) => {
			if (!userCache.hasOwnProperty(uid)) {
				try {
					userCache[uid] = RocketChat.models.Users.findById(uid).fetch()[0].username;
				} catch (e) {
					userCache[uid] = undefined;
				}
			}
			return userCache[uid];
		};

		const uid = Meteor.userId();
		//get subscription for message
		if (result.message) {
			result.message.docs.forEach((msg) => {

				const subscription = getSubscription(msg.rid, uid);

				if (subscription) {
					msg.r = {name: subscription.name, t: subscription.t};
					msg.username = getUsername(msg.user);
					msg.valid = true;
					SearchLogger.debug(`user ${ uid } can access ${ msg.rid } ( ${ subscription.t === 'd' ? subscription.username : subscription.name } )`);
				} else {
					SearchLogger.debug(`user ${ uid } can NOT access ${ msg.rid }`);
				}console.log(msg);
			});

			result.message.docs.filter((msg) => {
				return msg.valid;
			});
		}

		if (result.room) {
			result.room.docs.forEach((room) => {
				const subscription = getSubscription(room._id, uid);
				if (subscription) {
					room.valid = true;
					SearchLogger.debug(`user ${ uid } can access ${ room._id } ( ${ subscription.t === 'd' ? subscription.username : subscription.name } )`);
				} else {
					SearchLogger.debug(`user ${ uid } can NOT access ${ room._id }`);
				}
			});

			result.room.docs.filter((room) => {
				return room.valid;
			});
		}

		return result;
	}
}

export const validationService = new ValidationService();
