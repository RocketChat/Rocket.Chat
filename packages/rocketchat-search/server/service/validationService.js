import _ from 'underscore';

class ValidationService {
	constructor() {}

	_getSubscription(room_id, user_id) {
		return RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room_id, user_id);
	}

	validateSearchResult(result) {
		//TODO validate if current user is able to get the results
		const uid = Meteor.userId();
		//get subscription for message
		if (result.message) {
			result.message.doc = _.chain(result.message.docs)
				.each((msg) => {
					const subscription = Meteor.call('canAccessRoom', msg.rid, uid);
					if (subscription) {
						msg.r = {name: subscription.name, t: subscription.t};
						msg.username = subscription.username;
						msg.valid = true;
					}
				})
				.filter((msg) => {
					return msg.valid;
				}).value();
		}

		if (result.room) {
			result.room.docs = _.chain(result.room.docs)
				.forEach((room) => {
					const subscription = Meteor.call('canAccessRoom', room._id, uid);
					if (subscription) {
						room.valid = true;
					}
				})
				.filter((room) => {
					return room.valid;
				}).value();
		}

		//TODO what to do with non valid massages and rooms?

		return result;
	}
}

export const validationService = new ValidationService();
