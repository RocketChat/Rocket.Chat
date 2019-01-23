import { Meteor } from 'meteor/meteor';
import { Messages, Rooms } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { callbacks } from 'meteor/rocketchat:callbacks';

export const updateMessage = function(message, user, originalMessage) {
	if (!originalMessage) {
		originalMessage = Messages.findOneById(message._id);
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

	// If we keep history of edits, insert a new message to store history information
	if (settings.get('Message_KeepHistory')) {
		Messages.cloneAndSaveAsHistoryById(message._id);
	}

	message.editedAt = new Date();
	message.editedBy = {
		_id: user._id,
		username: user.username,
	};

	const urls = message.msg.match(/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g) || [];
	message.urls = urls.map((url) => ({ url }));

	message = callbacks.run('beforeSaveMessage', message);

	const tempid = message._id;
	delete message._id;

	Messages.update({ _id: tempid }, { $set: message });

	const room = Rooms.findOneById(message.rid);

	if (Apps && Apps.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		Apps.getBridges().getListenerBridge().messageEvent('IPostMessageUpdated', message);
	}

	Meteor.defer(function() {
		callbacks.run('afterSaveMessage', Messages.findOneById(tempid), room, user._id);
	});
};

RocketChat.updateMessage = updateMessage;
