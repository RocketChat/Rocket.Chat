import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { Messages, LivechatRooms } from '../../../../models/server';
import { API } from '../../../../api/server';
import { loadMessageHistory } from '../../../../lib';
import { findGuest, findRoom, normalizeHttpHeaderData } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { normalizeMessageFileUpload } from '../../../../utils/server/functions/normalizeMessageFileUpload';
import { settings } from '../../../../settings/server';

API.v1.addRoute('livechat/message', {
	async post() {
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

		const guest = await findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		const room = findRoom(token, rid);
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed');
		}

		if (
			settings.get('Livechat_enable_message_character_limit') &&
			msg.length > parseInt(settings.get('Livechat_message_character_limit'))
		) {
			throw new Meteor.Error('message-length-exceeds-character-limit');
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
			roomInfo: {
				source: {
					type: this.isWidget() ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
				},
			},
		};

		const result = await Livechat.sendMessage(sendMessage);
		if (result) {
			const message = Messages.findOneById(_id);
			return API.v1.success({ message });
		}

		return API.v1.failure();
	},
});

API.v1.addRoute('livechat/message/:_id', {
	async get() {
		check(this.urlParams, {
			_id: String,
		});

		check(this.queryParams, {
			token: String,
			rid: String,
		});

		const { token, rid } = this.queryParams;
		const { _id } = this.urlParams;

		const guest = await findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		const room = findRoom(token, rid);
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		let message = Messages.findOneById(_id);
		if (!message) {
			throw new Meteor.Error('invalid-message');
		}

		if (message.file) {
			message = await normalizeMessageFileUpload(message);
		}

		return API.v1.success({ message });
	},

	async put() {
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

		const guest = await findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		const room = findRoom(token, rid);
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		const msg = Messages.findOneById(_id);
		if (!msg) {
			throw new Meteor.Error('invalid-message');
		}

		const result = Livechat.updateMessage({
			guest,
			message: { _id: msg._id, msg: this.bodyParams.msg },
		});
		if (result) {
			let message = Messages.findOneById(_id);
			if (message.file) {
				message = await normalizeMessageFileUpload(message);
			}

			return API.v1.success({ message });
		}

		return API.v1.failure();
	},
	async delete() {
		check(this.urlParams, {
			_id: String,
		});

		check(this.bodyParams, {
			token: String,
			rid: String,
		});

		const { token, rid } = this.bodyParams;
		const { _id } = this.urlParams;

		const guest = await findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		const room = findRoom(token, rid);
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		const message = Messages.findOneById(_id);
		if (!message) {
			throw new Meteor.Error('invalid-message');
		}

		const result = await Livechat.deleteMessage({ guest, message });
		if (result) {
			return API.v1.success({
				message: {
					_id,
					ts: new Date().toISOString(),
				},
			});
		}

		return API.v1.failure();
	},
});

API.v1.addRoute('livechat/messages.history/:rid', {
	async get() {
		check(this.urlParams, {
			rid: String,
		});

		const { offset } = this.getPaginationItems();
		const { searchText: text, token } = this.queryParams;
		const { rid } = this.urlParams;
		const { sort } = this.parseJsonQuery();

		if (!token) {
			throw new Meteor.Error('error-token-param-not-provided', 'The required "token" query param is missing.');
		}

		const guest = await findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		const room = findRoom(token, rid);
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		let ls = undefined;
		if (this.queryParams.ls) {
			ls = new Date(this.queryParams.ls);
		}

		let end = undefined;
		if (this.queryParams.end) {
			end = new Date(this.queryParams.end);
		}

		let limit = 20;
		if (this.queryParams.limit) {
			limit = parseInt(this.queryParams.limit);
		}

		const messages = loadMessageHistory({
			userId: guest._id,
			rid,
			end,
			limit,
			ls,
			sort,
			offset,
			text,
		}).messages.map((...args) => Promise.await(normalizeMessageFileUpload(...args)));
		return API.v1.success({ messages });
	},
});

API.v1.addRoute(
	'livechat/messages',
	{ authRequired: true },
	{
		async post() {
			if (!this.bodyParams.visitor) {
				return API.v1.failure('Body param "visitor" is required');
			}
			if (!this.bodyParams.visitor.token) {
				return API.v1.failure('Body param "visitor.token" is required');
			}
			if (!this.bodyParams.messages) {
				return API.v1.failure('Body param "messages" is required');
			}
			if (!(this.bodyParams.messages instanceof Array)) {
				return API.v1.failure('Body param "messages" is not an array');
			}
			if (this.bodyParams.messages.length === 0) {
				return API.v1.failure('Body param "messages" is empty');
			}

			const visitorToken = this.bodyParams.visitor.token;

			let visitor = await LivechatVisitors.getVisitorByToken(visitorToken);
			let rid;
			if (visitor) {
				const rooms = LivechatRooms.findOpenByVisitorToken(visitorToken).fetch();
				if (rooms && rooms.length > 0) {
					rid = rooms[0]._id;
				} else {
					rid = Random.id();
				}
			} else {
				rid = Random.id();

				const guest = this.bodyParams.visitor;
				guest.connectionData = normalizeHttpHeaderData(this.request.headers);

				const visitorId = await Livechat.registerGuest(guest);
				visitor = await LivechatVisitors.findOneById(visitorId);
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
					roomInfo: {
						source: {
							type: this.isWidget() ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
						},
					},
				};
				const sentMessage = Promise.await(Livechat.sendMessage(sendMessage));
				return {
					username: sentMessage.u.username,
					msg: sentMessage.msg,
					ts: sentMessage.ts,
				};
			});

			return API.v1.success({
				messages: sentMessages,
			});
		},
	},
);
