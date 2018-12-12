import { Meteor } from 'meteor/meteor';
import { DDPCommon } from 'meteor/ddp-common';
const MY_MESSAGE = '__my_messages__';
const MY_MESSAGES_STREAM = '_m_';

Meteor.startup(function() {
	RocketChat.Notifications.msgStream.allowWrite('none');

	RocketChat.Notifications.msgStream.allowRead(function(eventName, args) {
		try {
			const room = Meteor.call('canAccessRoom', eventName, this.userId, args);
			return !!room;
		} catch (error) {
			/* error*/
			return false;
		}
	});


	RocketChat.Notifications.msgStream.allowRead('__my_messages__', 'all');

//msgStream.allowEmit(MY_MESSAGE, function(eventName, msg) {
//	try {
//		const room = Meteor.call('canAccessRoom', msg.rid, this.userId);

	// RocketChat.Notifications.msgStream.allowEmit('__my_messages__', function(eventName, msg, options) {
	// 	try {
	// 		const room = Meteor.call('canAccessRoom', msg.rid, this.userId);


	// 		if (!room) {
	// 			return false;
	// 		}

	// 		options.roomParticipant = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } }) != null;
	// 		options.roomType = room.t;
	// 		options.roomName = room.name;

	// 		return true;
	// 	} catch (error) {
	// 		/* error*/
	// 		return false;
	// 	}
	// });
	function publishMessage(type, record) {
		if (record._hidden !== true && (record.imported == null)) {
			const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;

			if (record.u && record.u._id && UI_Use_Real_Name) {
				const user = RocketChat.models.Users.findOneById(record.u._id);
				record.u.name = user && user.name;
			}

			if (record.mentions && record.mentions.length && UI_Use_Real_Name) {
				record.mentions.forEach((mention) => {
					const user = RocketChat.models.Users.findOneById(mention._id);
					mention.name = user && user.name;
				});
			}

			RocketChat.Notifications.msgStream.emit(`${ MY_MESSAGES_STREAM }${ record.rid }`, record, {});
			return RocketChat.Notifications.msgStream.emit(record.rid, record);
		}
	}

	return RocketChat.models.Messages.on('change', function({ clientAction, id, data, diff/* , oplog*/ }) {
		if (diff && (diff['u.username'] || diff['editedBy.username'] || Object.keys(diff).some(function(k) { return ~k.indexOf('mentions.'); }))) {
			return;
		}
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message = data || RocketChat.models.Messages.findOne({ _id: id });
				publishMessage(clientAction, message);
				break;
		}
	});
});
