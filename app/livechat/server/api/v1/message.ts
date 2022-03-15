import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';

import { hasPermission } from '../../../../authorization/server';
import { Messages, LivechatRooms, LivechatVisitors } from '../../../../models/server/raw/index';
import { API } from '../../../../api/server';
import { loadMessageHistory } from '../../../../lib/server/functions/loadMessageHistory';
import { findGuest, findRoom, normalizeHttpHeaderData } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { normalizeMessageFileUpload } from '../../../../utils/server/functions/normalizeMessageFileUpload';
import { settings } from '../../../../settings/server';
import { OmnichannelSourceType } from '../../../../../definition/IRoom';
import { IMessage } from '../../../../../definition/IMessage';

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

		const guest = findGuest(token);
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
			const message = await Messages.findOneById(_id);
			return API.v1.success({ message });
		}

		return API.v1.failure();
	},
});

API.v1.addRoute(
	'livechat/message/:_id',
	{ authRequired: false },
	{
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

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			let message = await Messages.findOneById(_id);
			if (!message) {
				throw new Meteor.Error('invalid-message');
			}

			if (message.file) {
				message = await normalizeMessageFileUpload(message);
			}

			return API.v1.success({ message: await message });
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

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Meteor.Error('invalid-room');
			}

			const msg = await Messages.findOneById(_id);
			if (!msg) {
				throw new Meteor.Error('invalid-message');
			}

			const result = Livechat.updateMessage({
				guest,
				message: { _id: msg._id, msg: this.bodyParams.msg },
			});
			if (result) {
				let message = await Messages.findOneById(_id);
				if (message.file) {
					message = await normalizeMessageFileUpload(message);
				}

				return API.v1.success({ message });
			}

			return API.v1.failure();
		},
		async delete() {
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

				const guest = findGuest(token);
				if (!guest) {
					throw new Meteor.Error('invalid-token');
				}

				const room = findRoom(token, rid);
				if (!room) {
					throw new Meteor.Error('invalid-room');
				}

				const message = await Messages.findOneById(_id);
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
			} catch (e) {
				return API.v1.failure(e);
			}
		},
	},
);

API.v1.addRoute('livechat/messages.history/:rid', {
	async get() {
		try {
			check(this.urlParams, {
				rid: String,
			});

			// TODO loadMessageHistory should support proper pagination
			// const { offset } = this.getPaginationItems();
			const { /* searchText: text */ token } = this.queryParams;
			const { rid } = this.urlParams;
			// const { sort } = this.parseJsonQuery();

			if (!token) {
				throw new Meteor.Error('error-token-param-not-provided', 'The required "token" query param is missing.');
			}

			const guest = findGuest(token);
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
			}).messages.map((message: IMessage) => normalizeMessageFileUpload(message));
			return API.v1.success({ messages });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute(
	'livechat/messages',
	{ authRequired: true },
	{
		async post() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}

			check(this.bodyParams, {
				visitor: { token: String },
				messages: Match.Where((v: any) => {
					return Array.isArray(v) && v.length > 0 && v.every((v) => v.msg && typeof v.msg === 'string');
				}),
			});

			const visitorToken = this.bodyParams.visitor.token;

			let visitor = await LivechatVisitors.getVisitorByToken(visitorToken, {});
			let rid: string;

			if (visitor) {
				const rooms = await LivechatRooms.findOpenByVisitorToken(visitorToken).toArray();
				if (rooms && rooms.length > 0) {
					rid = rooms[0]._id;
				} else {
					rid = Random.id();
				}
			} else {
				rid = Random.id();

				const guest = { ...this.bodyParams.visitor, connectionData: normalizeHttpHeaderData(this.request.headers) };

				// @ts-expect-error
				const visitorId = Livechat.registerGuest(guest);
				visitor = await LivechatVisitors.findOneById(visitorId, {});
			}

			const sentMessages = (this.bodyParams.messages as any[]).map(
				async (message: { msg: string }): Promise<{ username: string; msg: string; ts: Date }> => {
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
						agent: undefined,
					};
					const sentMessage = await Livechat.sendMessage(sendMessage);
					return {
						username: sentMessage.u.username,
						msg: sentMessage.msg,
						ts: sentMessage.ts,
					};
				},
			);

			return API.v1.success({
				messages: await Promise.all(sentMessages),
			});
		},
	},
);
