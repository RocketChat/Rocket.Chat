/* global processWebhookMessage */
RocketChat.API.v1.addRoute('chat.delete', { authRequired: true }, {
	post: function() {
		try {
			check(this.bodyParams, Match.ObjectIncluding({
				msgId: String,
				roomId: String,
				asUser: Match.Maybe(Boolean)
			}));

			const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId, { fields: { u: 1, rid: 1 }});

			if (!msg) {
				return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
			}

			if (this.bodyParams.roomId !== msg.rid) {
				return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
			}

			Meteor.runAsUser(this.bodyParams.asUser ? msg.u._id : this.userId, () => {
				Meteor.call('deleteMessage', { _id: msg._id });
			});

			return RocketChat.API.v1.success({
				_id: msg._id,
				ts: Date.now()
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}
	}
});

RocketChat.API.v1.addRoute('chat.postMessage', { authRequired: true }, {
	post: function() {
		try {
			const messageReturn = processWebhookMessage(this.bodyParams, this.user)[0];

			if (!messageReturn) {
				return RocketChat.API.v1.failure('unknown-error');
			}

			return RocketChat.API.v1.success({
				ts: Date.now(),
				channel: messageReturn.channel,
				message: messageReturn.message
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.name + ': ' + e.message);
		}
	}
});
