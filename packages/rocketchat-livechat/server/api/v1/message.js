import LivechatVisitors from '../../../server/models/LivechatVisitors';
import livechat from '../lib/livechat';

RocketChat.API.v1.addRoute('livechat/message', {
	post() {
		try {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				token: String,
				rid: String,
				msg: String,
				agent: Match.Maybe({
					agentId: String,
					username: String,
				}),
			});

			const { token, rid, agent, msg } = this.bodyParams;

			const guest = livechat.guest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = livechat.room(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const _id = this.bodyParams._id || Random.id();

			const sendMessage = {
				guest,
				message: {
					_id,
					rid,
					msg,
					token,
				},
				agent,
			};

			const result = RocketChat.Livechat.sendMessage(sendMessage);
			if (result) {
				const message = { msg: result.msg, u: result.u, ts: result.ts };
				return RocketChat.API.v1.success({ message });
			}

			return RocketChat.API.v1.failure();
		} catch (e) {
			return RocketChat.API.v1.failure(e);
		}
	},
});

RocketChat.API.v1.addRoute('livechat/message/:_id', {
	put() {
		try {
			check(this.urlParams, {
				_id: String,
			});

			check(this.bodyParams, {
				token: String,
				rid: String,
				msg: String,
			});

			const { token, rid } = this.bodyParams;
			const { _id } = this.urlParams;

			const guest = livechat.guest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = livechat.room(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const msg = RocketChat.models.Messages.findOneById(_id);
			if (!msg) {
				throw new Meteor.Error('invalid-message');
			}

			const message = { _id: msg._id, msg: this.bodyParams.msg };

			const result = RocketChat.Livechat.updateMessage({ guest, message });
			if (result) {
				return RocketChat.API.v1.success({
					message: RocketChat.models.Messages.findOneById(_id),
				});
			}

			return RocketChat.API.v1.failure();
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},
	delete() {
		try {
			check(this.urlParams, {
				_id: String,
			});

			check(this.bodyParams, {
				token: String,
				rid: String,
			});

			const { token, rid } = this.bodyParams;
			const { _id } = this.urlParams;

			const guest = livechat.guest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = livechat.room(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const message = RocketChat.models.Messages.findOneById(_id);
			if (!message) {
				throw new Meteor.Error('invalid-message');
			}

			const result = RocketChat.Livechat.deleteMessage({ guest, message });
			if (result) {
				return RocketChat.API.v1.success({
					message: {
						_id,
						ts: Date.now(),
					},
				});
			}

			return RocketChat.API.v1.failure();
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},
});

RocketChat.API.v1.addRoute('livechat/messages/:rid', {
	post() {
		try {
			check(this.urlParams, {
				rid: String,
			});
			console.log('1');
			check(this.bodyParams, {
				token: String,
				end: Match.Maybe(Date),
				limit: Match.Maybe(Number),
				ls: Match.Maybe(Date),
			});
			console.log('2');
			const defaultLimit = 20;
			const { token } = this.bodyParams;
			const { rid } = this.urlParams;
			console.log('3');
			const guest = livechat.guest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}
			console.log('4');
			const room = livechat.room(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}
			console.log('5');
			let { limit } = this.bodyParams;
			if (!limit || limit > defaultLimit) {
				limit = defaultLimit;
			}
			console.log('6');
			const ls = this.bodyParams.ls && new Date(this.bodyParams.ls);
			const end = this.bodyParams.end && new Date(this.bodyParams.end);
			console.log('7');
			const messages = RocketChat.loadMessageHistory({ userId: guest._id, rid, end, limit, ls });
			return RocketChat.API.v1.success(messages);

		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	},
});

RocketChat.API.v1.addRoute('livechat/messages', { authRequired: true }, {
	post() {
		if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
			return RocketChat.API.v1.unauthorized();
		}

		if (!this.bodyParams.visitor) {
			return RocketChat.API.v1.failure('Body param "visitor" is required');
		}
		if (!this.bodyParams.visitor.token) {
			return RocketChat.API.v1.failure('Body param "visitor.token" is required');
		}
		if (!this.bodyParams.messages) {
			return RocketChat.API.v1.failure('Body param "messages" is required');
		}
		if (!(this.bodyParams.messages instanceof Array)) {
			return RocketChat.API.v1.failure('Body param "messages" is not an array');
		}
		if (this.bodyParams.messages.length === 0) {
			return RocketChat.API.v1.failure('Body param "messages" is empty');
		}

		const visitorToken = this.bodyParams.visitor.token;

		let visitor = LivechatVisitors.getVisitorByToken(visitorToken);
		let rid;
		if (visitor) {
			const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken).fetch();
			if (rooms && rooms.length > 0) {
				rid = rooms[0]._id;
			} else {
				rid = Random.id();
			}
		} else {
			rid = Random.id();
			const visitorId = RocketChat.Livechat.registerGuest(this.bodyParams.visitor);
			visitor = LivechatVisitors.findOneById(visitorId);
		}

		const sentMessages = this.bodyParams.messages.map((message) => {
			const sendMessage = {
				guest: visitor,
				message: {
					_id: Random.id(),
					rid,
					token: visitorToken,
					msg: message.msg,
				},
			};
			const sentMessage = RocketChat.Livechat.sendMessage(sendMessage);
			return {
				username: sentMessage.u.username,
				msg: sentMessage.msg,
				ts: sentMessage.ts,
			};
		});

		return RocketChat.API.v1.success({
			messages: sentMessages,
		});
	},
});
