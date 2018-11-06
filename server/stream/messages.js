import { Meteor } from 'meteor/meteor';

const MY_MESSAGES = '__my_messages__';
const MY_MESSAGES_STREAM = '_m_';

class MsgStream extends Meteor.Streamer {
	_publish(publication, eventName, options) {
		const uid = Meteor.userId();
		if (eventName !== MY_MESSAGES) {
			super._publish(publication, eventName, options);
			const revokeSubscription = (clientAction, { rid }) => {
				if (clientAction === 'removed' && rid === eventName) {
					publication.stop();
					this.removeListener(uid, revokeSubscription);
				}
			};
			this.on(uid, revokeSubscription);
			return;
		}

		if (!this.isReadAllowed(publication, eventName)) {
			publication.stop();
			return;
		}

		const sendMyMessage = (msg) => {
			this.send(publication, msg);
		};

		const rooms = RocketChat.models.Subscriptions.find({ 'u._id': uid }, { fields: { rid: 1 } }).fetch();

		const userEvent = (clientAction, { rid }) => {
			switch (clientAction) {
				case 'inserted':
					rooms.push({ rid });
					this.on(`${ MY_MESSAGES_STREAM }${ rid }`, sendMyMessage);
					break;

				case 'removed':
					this.removeListener(rid, sendMyMessage);
					break;
			}
		};

		rooms.forEach(({ rid }) => {
			this.on(`${ MY_MESSAGES_STREAM }${ rid }`, sendMyMessage);
		});

		this.on(uid, userEvent);

		publication.onStop(() => {
			this.removeListener(uid, userEvent);
			rooms.forEach(({ rid }) => this.removeListener(`${ MY_MESSAGES_STREAM }${ rid }`, sendMyMessage));
		});
	}
}

const msgStream = new MsgStream('room-messages');
this.msgStream = msgStream;

msgStream.allowWrite('none');

msgStream.allowRead(function(eventName, args) {
	try {
		const room = Meteor.call('canAccessRoom', eventName, this.userId, args);
		return !!room;
	} catch (error) {
		/* error*/
		return false;
	}
});

msgStream.allowRead(MY_MESSAGES, 'all');

msgStream.allowEmit(MY_MESSAGES, function(eventName, msg, options) {
	try {
		const room = Meteor.call('canAccessRoom', msg.rid, this.userId);

		if (!room) {
			return false;
		}

		options.roomParticipant = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } }) != null;
		options.roomType = room.t;
		options.roomName = room.name;

		return true;
	} catch (error) {
		/* error*/
		return false;
	}
});

Meteor.startup(function() {
	function publishMessage(type, record) {
		if (record._hidden === true || record.imported != null) {
			return;
		}
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
		msgStream.__emit(`${ MY_MESSAGES_STREAM }${ record.rid }`, msgStream.changedPayload({ eventName: MY_MESSAGES, args:[record] }));
		return msgStream.emitWithoutBroadcast(record.rid, record);
	}

	return RocketChat.models.Messages.on('change', function({ clientAction, id, data/* , oplog*/ }) {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message = data || RocketChat.models.Messages.findOne({ _id: id });
				publishMessage(clientAction, message);
				break;
		}
	});
});
