/* global processWebhookMessage */
RocketChat.API.v1.addRoute('chat.delete', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			msgId: String,
			roomId: String,
			asUser: Match.Maybe(Boolean)
		}));

		const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId, { fields: { u: 1, rid: 1 }});

		if (!msg) {
			return RocketChat.API.v1.failure(`No message found with the id of "${ this.bodyParams.msgId }".`);
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
	}
});

RocketChat.API.v1.addRoute('chat.postMessage', { authRequired: true }, {
	post() {
		const messageReturn = processWebhookMessage(this.bodyParams, this.user)[0];

		if (!messageReturn) {
			return RocketChat.API.v1.failure('unknown-error');
		}

		return RocketChat.API.v1.success({
			ts: Date.now(),
			channel: messageReturn.channel,
			message: messageReturn.message
		});
	}
});

RocketChat.API.v1.addRoute('chat.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			roomId: String,
			msgId: String,
			text: String //Using text to be consistant with chat.postMessage
		}));

		const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId);

		//Ensure the message exists
		if (!msg) {
			return RocketChat.API.v1.failure(`No message found with the id of "${ this.bodyParams.msgId }".`);
		}

		if (this.bodyParams.roomId !== msg.rid) {
			return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
		}

		//Permission checks are already done in the updateMessage method, so no need to duplicate them
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('updateMessage', { _id: msg._id, msg: this.bodyParams.text, rid: msg.rid });

		});

		return RocketChat.API.v1.success({
			message: RocketChat.models.Messages.findOneById(msg._id)
		});
	}
});
