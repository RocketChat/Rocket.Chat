import { Random } from 'meteor/random';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import {
	isPOSTLivechatMessageParams,
	isGETLivechatMessageIdParams,
	isPUTLivechatMessageIdParams,
	isDELETELivechatMessageIdParams,
	isGETLivechatMessagesHistoryRidParams,
	isGETLivechatMessagesParams,
} from '@rocket.chat/rest-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { Messages, LivechatRooms } from '../../../../models/server';
import { API } from '../../../../api/server';
import { loadMessageHistory } from '../../../../lib/server';
import { findGuest, findRoom, normalizeHttpHeaderData } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { normalizeMessageFileUpload } from '../../../../utils/server/functions/normalizeMessageFileUpload';
import { settings } from '../../../../settings/server';

API.v1.addRoute(
	'livechat/message',
	{ validateParams: isPOSTLivechatMessageParams },
	{
		async post() {
			const { token, rid, agent, msg } = this.bodyParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			if (!room.open) {
				throw new Error('room-closed');
			}

			if (
				settings.get('Livechat_enable_message_character_limit') &&
				msg.length > parseInt(settings.get('Livechat_message_character_limit'))
			) {
				throw new Error('message-length-exceeds-character-limit');
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
	},
);

API.v1.addRoute(
	'livechat/message/:_id',
	{ validateParams: { GET: isGETLivechatMessageIdParams, PUT: isPUTLivechatMessageIdParams, DELETE: isDELETELivechatMessageIdParams } },
	{
		async get() {
			const { token, rid } = this.queryParams;
			const { _id } = this.urlParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			let message = Messages.findOneById(_id);
			if (!message) {
				throw new Error('invalid-message');
			}

			if (message.file) {
				message = await normalizeMessageFileUpload(message);
			}

			return API.v1.success({ message });
		},

		async put() {
			const { token, rid } = this.bodyParams;
			const { _id } = this.urlParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			const msg = Messages.findOneById(_id);
			if (!msg) {
				throw new Error('invalid-message');
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
			const { token, rid } = this.bodyParams;
			const { _id } = this.urlParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			const message = Messages.findOneById(_id);
			if (!message) {
				throw new Error('invalid-message');
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
	},
);

API.v1.addRoute(
	'livechat/messages.history/:rid',
	{ validateParams: isGETLivechatMessagesHistoryRidParams },
	{
		async get() {
			const { offset } = this.getPaginationItems();
			const { searchText: text, token } = this.queryParams;
			const { rid } = this.urlParams;
			const { sort } = this.parseJsonQuery();

			if (!token) {
				throw new Error('error-token-param-not-provided');
			}

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			const room = findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
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
				limit = parseInt(`${this.queryParams.limit}`, 10);
			}

			const messages = await Promise.all(
				loadMessageHistory({
					userId: guest._id,
					rid,
					// @ts-expect-error -- typings on loadMessageHistory are wrong
					end,
					limit,
					// @ts-expect-error -- typings on loadMessageHistory are wrong
					ls,
					sort,
					offset,
					text,
				}).messages.map((message) => normalizeMessageFileUpload(message)),
			);
			return API.v1.success({ messages });
		},
	},
);

API.v1.addRoute(
	'livechat/messages',
	{ authRequired: true, validateParams: isGETLivechatMessagesParams },
	{
		async post() {
			const visitorToken = this.bodyParams.visitor.token;

			let visitor = await LivechatVisitors.getVisitorByToken(visitorToken, {});
			let rid: string;
			if (visitor) {
				const rooms = LivechatRooms.findOpenByVisitorToken(visitorToken).fetch();
				if (rooms && rooms.length > 0) {
					rid = rooms[0]._id;
				} else {
					rid = Random.id();
				}
			} else {
				rid = Random.id();

				const guest: typeof this.bodyParams.visitor & { connectionData?: unknown } = this.bodyParams.visitor;
				guest.connectionData = normalizeHttpHeaderData(this.request.headers);

				// @ts-expect-error -- Typings on registerGuest are wrong
				const visitorId = await Livechat.registerGuest(guest);
				visitor = await LivechatVisitors.findOneById(visitorId);
			}

			const sentMessages = await Promise.all(
				this.bodyParams.messages.map(async (message) => {
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
					// @ts-expect-error -- Typings on sendMessage are wrong
					const sentMessage = await Livechat.sendMessage(sendMessage);
					return {
						username: sentMessage.u.username,
						msg: sentMessage.msg,
						ts: sentMessage.ts,
					};
				}),
			);

			return API.v1.success({
				messages: sentMessages,
			});
		},
	},
);
