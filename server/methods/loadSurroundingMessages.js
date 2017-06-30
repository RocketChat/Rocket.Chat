Meteor.methods({
	loadSurroundingMessages(message, limit = 50) {
		check(message, Object);
		check(limit, Number);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadSurroundingMessages'
			});
		}

		const fromId = Meteor.userId();

		if (!message._id) {
			return false;
		}

		message = RocketChat.models.Messages.findOneById(message._id);

		if (!message || !message.rid) {
			return false;
		}

		if (!Meteor.call('canAccessRoom', message.rid, fromId)) {
			return false;
		}

		limit = limit - 1;

		const options = {
			sort: {
				ts: -1
			},
			limit: Math.ceil(limit / 2)
		};

		if (!RocketChat.settings.get('Message_ShowEditedStatus')) {
			options.fields = {
				editedAt: 0
			};
		}

		const recordsBefore = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestamp(message.rid, message.ts, options).fetch();

		const messages = recordsBefore.map((message) => {
			message.starred = _.findWhere(message.starred, {
				_id: fromId
			});
			return message;
		});

		const moreBefore = messages.length === options.limit;

		messages.push(message);

		options.sort = {
			ts: 1
		};

		options.limit = Math.floor(limit / 2);

		const recordsAfter = RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp(message.rid, message.ts, options).fetch();
		const afterMessages = recordsAfter.map((message) => {
			message.starred = _.findWhere(message.starred, {
				_id: fromId
			});
			return message;
		});

		const moreAfter = afterMessages.length === options.limit;

		return {
			messages: messages.concat(afterMessages),
			moreBefore,
			moreAfter
		};
	}
});
