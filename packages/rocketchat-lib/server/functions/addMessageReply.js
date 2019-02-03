import { Meteor } from 'meteor/meteor';

RocketChat.addMessageReply = function(message, user, originalMessage) {
	if (!originalMessage) {
		originalMessage = RocketChat.models.Messages.findOneById(message._id);
	}

	// For the Rocket.Chat Apps :)
	if (message && Apps && Apps.isLoaded()) {
		const appMessage = Object.assign({}, originalMessage, message);

		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageUpdatedPrevent', appMessage));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-updating', 'A Rocket.Chat App prevented the message updating.');
		}

		let result;
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageUpdatedExtend', appMessage));
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageUpdatedModify', result));

		if (typeof result === 'object') {
			message = Object.assign(appMessage, result);
		}
	}

	const tempid = message._id;
	delete message._id;

	RocketChat.models.Messages.update({ _id: tempid }, { $set: message });

	const room = RocketChat.models.Rooms.findOneById(message.rid);

	if (Apps && Apps.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		Apps.getBridges().getListenerBridge().messageEvent('IPostMessageUpdated', message);
	}

	Meteor.defer(function() {
		RocketChat.callbacks.run('afterSaveMessage', RocketChat.models.Messages.findOneById(tempid), room, user._id);
	});
};
