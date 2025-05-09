import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms, Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import {
	isPOSTLivechatMessageParams,
	isGETLivechatMessageIdParams,
	isPUTLivechatMessageIdParams,
	isDELETELivechatMessageIdParams,
	isGETLivechatMessagesHistoryRidParams,
	isGETLivechatMessagesParams,
} from '@rocket.chat/rest-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { isWidget } from '../../../../api/server/helpers/isWidget';
import { loadMessageHistory } from '../../../../lib/server/functions/loadMessageHistory';
import { settings } from '../../../../settings/server';
import { normalizeMessageFileUpload } from '../../../../utils/server/functions/normalizeMessageFileUpload';
import { registerGuest } from '../../lib/guests';
import { updateMessage, deleteMessage, sendMessage } from '../../lib/messages';
import { findGuest, findRoom, normalizeHttpHeaderData } from '../lib/livechat';

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

			const room = await findRoom(token, rid);
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

			const messageToSend = {
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
						type: isWidget(this.request.headers) ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
					},
				},
			};

			const result = await sendMessage(messageToSend);
			if (result) {
				const message = await Messages.findOneById(_id);
				if (!message) {
					return API.v1.failure();
				}
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

			const room = await findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			let message = await Messages.findOneByRoomIdAndMessageId(rid, _id);
			if (!message) {
				throw new Error('invalid-message');
			}

			if (message.file) {
				message = { ...(await normalizeMessageFileUpload(message)), ...{ _updatedAt: message._updatedAt } };
			}

			if (!message) {
				throw new Error('invalid-message');
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

			const room = await findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			// TODO: projection
			const msg = await Messages.findOneById(_id);
			if (!msg) {
				throw new Error('invalid-message');
			}

			const result = await updateMessage({
				guest,
				message: { _id: msg._id, msg: this.bodyParams.msg, rid: msg.rid },
			});
			if (!result) {
				return API.v1.failure();
			}

			let message = await Messages.findOneById(_id);
			if (!message) {
				return API.v1.failure();
			}

			if (message?.file) {
				message = { ...(await normalizeMessageFileUpload(message)), ...{ _updatedAt: message._updatedAt } };
			}

			if (!message) {
				throw new Error('invalid-message');
			}

			return API.v1.success({ message });
		},
		async delete() {
			const { token, rid } = this.bodyParams;
			const { _id } = this.urlParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			const room = await findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			const message = await Messages.findOneById(_id);
			if (!message) {
				throw new Error('invalid-message');
			}

			const result = await deleteMessage({ guest, message });
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
			const { offset } = await getPaginationItems(this.queryParams);
			const { token } = this.queryParams;
			const { rid } = this.urlParams;

			if (!token) {
				throw new Error('error-token-param-not-provided');
			}

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			const room = await findRoom(token, rid);
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

			const history = await loadMessageHistory({
				userId: guest._id,
				rid,
				end,
				limit,
				ls,
				offset,
			});

			const messages = await Promise.all(history.messages.map((message) => normalizeMessageFileUpload(message)));

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

			const visitor = await LivechatVisitors.getVisitorByToken(visitorToken, {});
			let rid: string;
			if (visitor) {
				const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
				const rooms = await LivechatRooms.findOpenByVisitorToken(visitorToken, {}, extraQuery).toArray();
				if (rooms && rooms.length > 0) {
					rid = rooms[0]._id;
				} else {
					rid = Random.id();
				}
			} else {
				rid = Random.id();

				const guest: typeof this.bodyParams.visitor & { connectionData?: unknown } = this.bodyParams.visitor;
				guest.connectionData = normalizeHttpHeaderData(this.request.headers);

				const visitor = await registerGuest(guest);
				if (!visitor) {
					throw new Error('error-livechat-visitor-registration');
				}
			}

			const guest = visitor;
			if (!guest) {
				throw new Error('error-invalid-token');
			}

			const sentMessages = await Promise.all(
				this.bodyParams.messages.map(async (message: { msg: string }): Promise<{ username: string; msg: string; ts: number }> => {
					const messageToSend = {
						guest,
						message: {
							_id: Random.id(),
							rid,
							token: visitorToken,
							msg: message.msg,
						},
						roomInfo: {
							source: {
								type: isWidget(this.request.headers) ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
							},
						},
					};

					const sentMessage = await sendMessage(messageToSend);
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
