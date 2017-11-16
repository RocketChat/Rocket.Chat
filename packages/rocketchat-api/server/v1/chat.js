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

RocketChat.API.v1.addRoute('chat.syncMessages', { authRequired: true }, {
	get() {
		const { rid } = this.queryParams;
		let lastUpdate = this.queryParams;
		lastUpdate = lastUpdate ? new Date(lastUpdate) : lastUpdate;
		if (!rid) {
			return RocketChat.API.v1.failure('The "rid" query parameter must be provided.');
		}
		if (!lastUpdate) {
			return RocketChat.API.v1.failure('The "lastUpdate" query parameter must be provided.');
		}

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('messages/get', rid, { lastUpdate });
		});

		if (!result) {
			return RocketChat.API.v1.failure();
		}

		return RocketChat.API.v1.success({result});
	}
});

RocketChat.API.v1.addRoute('chat.getMessage', { authRequired: true }, {
	get() {
		if (!this.queryParams.msgId) {
			return RocketChat.API.v1.failure('The "msgId" query parameter must be provided.');
		}


		let msg;
		Meteor.runAsUser(this.userId, () => {
			msg = Meteor.call('getSingleMessage', this.queryParams.msgId);
		});

		if (!msg) {
			return RocketChat.API.v1.failure();
		}

		return RocketChat.API.v1.success({
			message: msg
		});
	}
});

RocketChat.API.v1.addRoute('chat.pinMessage', { authRequired: true }, {
	post() {
		if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
			throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
		}

		const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

		if (!msg) {
			throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
		}

		let pinnedMessage;
		Meteor.runAsUser(this.userId, () => pinnedMessage = Meteor.call('pinMessage', msg));

		return RocketChat.API.v1.success({
			message: pinnedMessage
		});
	}
});

RocketChat.API.v1.addRoute('chat.postMessage', { authRequired: true }, {
	post() {
		const messageReturn = processWebhookMessage(this.bodyParams, this.user, undefined, true)[0];

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

RocketChat.API.v1.addRoute('chat.starMessage', { authRequired: true }, {
	post() {
		if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
			throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
		}

		const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

		if (!msg) {
			throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
			_id: msg._id,
			rid: msg.rid,
			starred: true
		}));

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('chat.unPinMessage', { authRequired: true }, {
	post() {
		if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
			throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
		}

		const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

		if (!msg) {
			throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('unpinMessage', msg));

		return RocketChat.API.v1.success();
	}
});

RocketChat.API.v1.addRoute('chat.unStarMessage', { authRequired: true }, {
	post() {
		if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
			throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
		}

		const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

		if (!msg) {
			throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
			_id: msg._id,
			rid: msg.rid,
			starred: false
		}));

		return RocketChat.API.v1.success();
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
