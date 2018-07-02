const msgStream = new Meteor.Streamer('room-messages');
this.msgStream = msgStream;

msgStream.allowWrite('none');

msgStream.allowRead(function(eventName, args) {
	try {
		const room = Meteor.call('canAccessRoom', eventName, this.userId, args);

		if (!room) {
			return false;
		}

		if (room.t === 'c' && !RocketChat.authz.hasPermission(this.userId, 'preview-c-room') && !RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } })) {
			return false;
		}

		return true;
	} catch (error) {
		/*error*/
		return false;
	}
});

msgStream.allowRead('__my_messages__', 'all');

msgStream.allowEmit('__my_messages__', function(eventName, msg, options) {
	try {
		const room = Meteor.call('canAccessRoom', msg.rid, this.userId);

		if (!room) {
			return false;
		}

		options.roomParticipant = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, { fields: { _id: 1 } }) != null;
		options.roomType = room.t;

		return true;
	} catch (error) {
		/*error*/
		return false;
	}
});

Meteor.startup(function() {
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
			msgStream.emitWithoutBroadcast('__my_messages__', record, {});
			return msgStream.emitWithoutBroadcast(record.rid, record);
		}
	}

	return RocketChat.models.Messages.on('change', function({ clientAction, id, data/*, oplog*/ }) {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				const message = data || RocketChat.models.Messages.findOne({ _id: id });
				publishMessage(clientAction, message);
				break;
		}
	});
});
