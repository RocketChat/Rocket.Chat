import SearchLogger from '../logger/logger';

class ValidationService {
	constructor() {}

	validateSearchResult(result) {

		const uid = Meteor.userId();
		//get subscription for message
		if (result.message) {
			result.message.docs.forEach((msg) => {
				const subscription = Meteor.call('canAccessRoom', msg.rid, uid);
				if (subscription) {
					msg.r = {name: subscription.name, t: subscription.t};
					msg.username = subscription.username;
					msg.valid = true;
					SearchLogger.debug(`user ${ uid } can access ${ msg.rid } ( ${ subscription.t === 'd' ? subscription.username : subscription.name } )`);
				} else {
					SearchLogger.debug(`user ${ uid } can NOT access ${ msg.rid }`);
				}
			});

			result.message.docs.filter((msg) => {
				SearchLogger.debug(JSON.stringify(msg, null, 2));
				return msg.valid;
			});
		}

		if (result.room) {
			result.room.docs.forEach((room) => {
				const subscription = Meteor.call('canAccessRoom', room._id, uid);
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
