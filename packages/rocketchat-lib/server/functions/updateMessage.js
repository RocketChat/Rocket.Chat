import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';

RocketChat.updateMessage = function(message, user, originalMessage) {
	if (!originalMessage) {
		originalMessage = RocketChat.models.Messages.findOneById(message._id);
	}

	if (!user._id) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'updateMessage',
		});
	}

	if (message.msg) {
		const adjustedMessage = RocketChat.messageProperties.messageWithoutEmojiShortnames(message.msg);

		if (RocketChat.messageProperties.length(adjustedMessage) > RocketChat.settings.get('Message_MaxAllowedSize')) {
			throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
				method: 'updateMessage',
			});
		}
	}
	const room = Meteor.call('canAccessRoom', message.rid, user._id);

	if (!room) {
		return false;
	}

	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, user._id);
	if (subscription && (subscription.blocked || subscription.blocker)) {
		RocketChat.Notifications.notifyUser(user._id, 'message', {
			_id: Random.id(),
			rid: room._id,
			ts: new Date,
			msg: TAPi18n.__('room_is_blocked', {}, user.language),
		});
		throw new Meteor.Error('You can\'t send messages because you are blocked');
	}

	if ((room.muted || []).includes(user.username)) {
		RocketChat.Notifications.notifyUser(user._id, 'message', {
			_id: Random.id(),
			rid: room._id,
			ts: new Date,
			msg: TAPi18n.__('You_have_been_muted', {}, user.language),
		});
		throw new Meteor.Error('You can\'t send messages because you have been muted');
	}

	if (room.archived) {
		RocketChat.Notifications.notifyUser(user._id, 'message', {
			_id: Random.id(),
			rid: room._id,
			ts: new Date(),
			msg: TAPi18n.__('Channel_Archived', {
				postProcess: 'sprintf',
				sprintf: [room.name],
			}, user.language),
		});
		throw new Meteor.Error('You can\'t send messages because the room is archived');
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
	if (RocketChat.settings.get('Message_KeepHistory')) {
		RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
	}

	message.editedAt = new Date();
	message.editedBy = {
		_id: user._id,
		username: user.username,
	};

	const urls = message.msg.match(/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g) || [];
	message.urls = urls.map((url) => ({ url }));

	message = RocketChat.callbacks.run('beforeSaveMessage', message);

	const tempid = message._id;
	delete message._id;

	RocketChat.models.Messages.update({ _id: tempid }, { $set: message });

	if (Apps && Apps.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		Apps.getBridges().getListenerBridge().messageEvent('IPostMessageUpdated', message);
	}

	Meteor.defer(function() {
		RocketChat.callbacks.run('afterSaveMessage', RocketChat.models.Messages.findOneById(tempid), room, user._id);
	});
};
