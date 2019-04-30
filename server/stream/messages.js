import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../app/authorization';
import { settings } from '../../app/settings';
import { Subscriptions, Users, Messages } from '../../app/models';
import { msgStream } from '../../app/lib';

const MY_MESSAGE = '__my_messages__';

msgStream.allowWrite('none');

msgStream.allowRead(function(eventName, args) {
	try {
		const room = Meteor.call('canAccessRoom', eventName, this.userId, args);

		if (!room) {
			return false;
		}

		if (room.t === 'c' && !hasPermission(this.userId, 'preview-c-room') && !Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } })) {
			return false;
		}

		return true;
	} catch (error) {
		/* error*/
		return false;
	}
});

msgStream.allowRead(MY_MESSAGE, 'all');

msgStream.allowEmit(MY_MESSAGE, function(eventName, msg) {
	try {
		const room = Meteor.call('canAccessRoom', msg.rid, this.userId);

		if (!room) {
			return false;
		}

		return {
			roomParticipant: Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } }) != null,
			roomType: room.t,
			roomName: room.name,
		};
	} catch (error) {
		/* error*/
		return false;
	}
});

Meteor.startup(function() {
	function publishMessage(type, record) {
		if (record._hidden !== true && (record.imported == null)) {
			const UI_Use_Real_Name = settings.get('UI_Use_Real_Name') === true;

			if (record.u && record.u._id && UI_Use_Real_Name) {
				const user = Users.findOneById(record.u._id);
				record.u.name = user && user.name;
			}

			if (record.mentions && record.mentions.length && UI_Use_Real_Name) {
				record.mentions.forEach((mention) => {
					const user = Users.findOneById(mention._id);
					mention.name = user && user.name;
				});
			}
			msgStream.mymessage(MY_MESSAGE, record);
			msgStream.emitWithoutBroadcast(record.rid, record);
		}
	}

	return Messages.on('change', function({ clientAction, id, data/* , oplog*/ }) {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message = data || Messages.findOne({ _id: id });
				publishMessage(clientAction, message);
				break;
		}
	});
});
