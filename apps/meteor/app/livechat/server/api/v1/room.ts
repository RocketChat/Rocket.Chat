import { Omnichannel } from '@rocket.chat/core-services';
import type { ILivechatAgent, IOmnichannelInquiryExtraData, IUser, SelectedAgent, TransferByData } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users, LivechatRooms, Messages } from '@rocket.chat/models';
import {
	isLiveChatRoomForwardProps,
	isPOSTLivechatRoomCloseParams,
	isPOSTLivechatRoomTransferParams,
	isPOSTLivechatRoomSurveyParams,
	isLiveChatRoomJoinProps,
	isLiveChatRoomSaveInfoProps,
	isPOSTLivechatRoomCloseByUserParams,
} from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';

import { callbacks } from '../../../../../lib/callbacks';
import { i18n } from '../../../../../server/lib/i18n';
import { API } from '../../../../api/server';
import { isWidget } from '../../../../api/server/helpers/isWidget';
import { canAccessRoomAsync } from '../../../../authorization/server';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { addUserToRoom } from '../../../../lib/server/functions/addUserToRoom';
import { closeLivechatRoom } from '../../../../lib/server/functions/closeLivechatRoom';
import { settings as rcSettings } from '../../../../settings/server';
import { normalizeTransferredByData } from '../../lib/Helper';
import { closeRoom } from '../../lib/closeRoom';
import { saveGuest } from '../../lib/guests';
import type { CloseRoomParams } from '../../lib/localTypes';
import { livechatLogger } from '../../lib/logger';
import { createRoom, saveRoomInfo } from '../../lib/rooms';
import { transfer } from '../../lib/transfer';
import { findGuest, findRoom, settings, findAgent, onCheckRoomParams } from '../lib/livechat';

const isAgentWithInfo = (agentObj: ILivechatAgent | { hiddenInfo: boolean }): agentObj is ILivechatAgent => !('hiddenInfo' in agentObj);

API.v1.addRoute(
	'livechat/room',
	{
		rateLimiterOptions: {
			numRequestsAllowed: 5,
			intervalTimeInMS: 60000,
		},
	},
	{
		async get() {
			// I'll temporary use check for validation, as validateParams doesnt support what's being done here
			const extraCheckParams = await onCheckRoomParams({
				token: String,
				rid: Match.Maybe(String),
				agentId: Match.Maybe(String),
			});

			check(this.queryParams, extraCheckParams as any);

			const { token, rid, agentId, ...extraParams } = this.queryParams;

			const guest = token && (await findGuest(token));
			if (!guest) {
				throw new Error('invalid-token');
			}

			if (!rid) {
				const room = await LivechatRooms.findOneOpenByVisitorToken(token, {});
				if (room) {
					return API.v1.success({ room, newRoom: false });
				}

				let agent: SelectedAgent | undefined;
				const agentObj = agentId && (await findAgent(agentId));
				if (agentObj) {
					if (isAgentWithInfo(agentObj)) {
						const { username = undefined } = agentObj;
						agent = { agentId, username };
					} else {
						agent = { agentId };
					}
				}

				const roomInfo = {
					source: {
						...(isWidget(this.request.headers)
							? { type: OmnichannelSourceType.WIDGET, destination: this.request.headers.get('host')! }
							: { type: OmnichannelSourceType.API }),
					},
				};

				const newRoom = await createRoom({
					visitor: guest,
					roomInfo,
					agent,
					extraData: extraParams as IOmnichannelInquiryExtraData,
				});

				return API.v1.success({
					room: newRoom,
					newRoom: true,
				});
			}

			const froom = await LivechatRooms.findOneOpenByRoomIdAndVisitorToken(rid, token, {});
			if (!froom) {
				throw new Error('invalid-room');
			}

			return API.v1.success({ room: froom, newRoom: false });
		},
	},
);

// Note: use this route if a visitor is closing a room
// If a RC user(like eg agent) is closing a room, use the `livechat/room.closeByUser` route
API.v1.addRoute(
	'livechat/room.close',
	{ validateParams: isPOSTLivechatRoomCloseParams },
	{
		async post() {
			const { rid, token } = this.bodyParams;

			if (!rcSettings.get('Omnichannel_allow_visitors_to_close_conversation')) {
				throw new Error('error-not-allowed-to-close-conversation');
			}

			const visitor = await findGuest(token);
			if (!visitor) {
				throw new Error('invalid-token');
			}

			const room = await findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			if (!room.open) {
				throw new Error('room-closed');
			}

			const language = rcSettings.get<string>('Language') || 'en';
			const comment = i18n.t('Closed_by_visitor', { lng: language });

			const options: CloseRoomParams['options'] = {};
			if (room.servedBy) {
				const servingAgent: Pick<IUser, '_id' | 'name' | 'username' | 'utcOffset' | 'settings' | 'language'> | null =
					await Users.findOneById(room.servedBy._id, {
						projection: {
							name: 1,
							username: 1,
							utcOffset: 1,
							settings: 1,
							language: 1,
						},
					});

				if (servingAgent?.settings?.preferences?.omnichannelTranscriptPDF) {
					options.pdfTranscript = {
						requestedBy: servingAgent._id,
					};
				}

				// We'll send the transcript by email only if the setting is disabled (that means, we're not asking the user if he wants to receive the transcript by email)
				// And the agent has the preference enabled to send the transcript by email and the visitor has an email address
				// When Livechat_enable_transcript is enabled, the email will be sent via livechat/transcript route
				if (
					!rcSettings.get<boolean>('Livechat_enable_transcript') &&
					servingAgent?.settings?.preferences?.omnichannelTranscriptEmail &&
					visitor.visitorEmails?.length &&
					visitor.visitorEmails?.[0]?.address
				) {
					const visitorEmail = visitor.visitorEmails?.[0]?.address;

					const language = servingAgent.language || rcSettings.get<string>('Language') || 'en';
					const t = i18n.getFixedT(language);
					const subject = t('Transcript_of_your_livechat_conversation');

					options.emailTranscript = {
						sendToVisitor: true,
						requestData: {
							email: visitorEmail,
							requestedAt: new Date(),
							requestedBy: servingAgent,
							subject,
						},
					};
				}
			}

			await closeRoom({ visitor, room, comment, options });

			return API.v1.success({ rid, comment });
		},
	},
);

API.v1.addRoute(
	'livechat/room.closeByUser',
	{
		validateParams: isPOSTLivechatRoomCloseByUserParams,
		authRequired: true,
		permissionsRequired: ['close-livechat-room'],
	},
	{
		async post() {
			const { rid, comment, tags, generateTranscriptPdf, transcriptEmail, forceClose } = this.bodyParams;

			const allowForceClose = rcSettings.get<boolean>('Omnichannel_allow_force_close_conversations');
			const isForceClosing = allowForceClose && forceClose;

			if (isForceClosing) {
				livechatLogger.warn({ msg: 'Force closing a conversation', user: this.userId, room: rid });
			}

			await closeLivechatRoom(this.user, rid, {
				comment,
				tags,
				generateTranscriptPdf,
				transcriptEmail,
				forceClose: isForceClosing,
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room.transfer',
	{ validateParams: isPOSTLivechatRoomTransferParams, deprecation: { version: '7.0.0' } },
	{
		async post() {
			const { rid, token, department } = this.bodyParams;

			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			let room = await findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			// update visited page history to not expire
			await Messages.keepHistoryForToken(token);

			const { _id, username, name } = guest;
			const transferredBy = normalizeTransferredByData({ _id, username, name, userType: 'visitor' }, room);

			if (!(await transfer(room, guest, { departmentId: department, transferredBy }))) {
				return API.v1.failure();
			}

			room = await findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			return API.v1.success({ room });
		},
	},
);

API.v1.addRoute(
	'livechat/room.survey',
	{ validateParams: isPOSTLivechatRoomSurveyParams },
	{
		async post() {
			const { rid, token, data } = this.bodyParams;

			const visitor = await findGuest(token);
			if (!visitor) {
				throw new Error('invalid-token');
			}

			const room = await findRoom(token, rid);
			if (!room) {
				throw new Error('invalid-room');
			}

			const config = await settings();
			if (!config.survey?.items || !config.survey.values) {
				throw new Error('invalid-livechat-config');
			}

			const updateData: { [k: string]: string } = {};
			for (const item of data) {
				if ((config.survey.items.includes(item.name) && config.survey.values.includes(item.value)) || item.name === 'additionalFeedback') {
					updateData[item.name] = item.value;
				}
			}

			if (Object.keys(updateData).length === 0) {
				throw new Error('invalid-data');
			}

			if (!(await LivechatRooms.updateSurveyFeedbackById(room._id, updateData))) {
				return API.v1.failure();
			}

			return API.v1.success({ rid, data: updateData });
		},
	},
);

API.v1.addRoute(
	'livechat/room.forward',
	{ authRequired: true, permissionsRequired: ['view-l-room', 'transfer-livechat-guest'], validateParams: isLiveChatRoomForwardProps },
	{
		async post() {
			const transferData = this.bodyParams as typeof this.bodyParams & {
				transferredBy: TransferByData;
				transferredTo?: { _id: string; username?: string; name?: string };
			};

			const room = await LivechatRooms.findOneById(this.bodyParams.roomId);
			if (!room || room.t !== 'l') {
				throw new Error('error-invalid-room');
			}

			if (!room.open) {
				throw new Error('This_conversation_is_already_closed');
			}

			if (!(await Omnichannel.isWithinMACLimit(room))) {
				throw new Error('error-mac-limit-reached');
			}

			const guest = await LivechatVisitors.findOneEnabledById(room.v?._id);
			if (!guest) {
				throw new Error('error-invalid-visitor');
			}

			transferData.transferredBy = normalizeTransferredByData(this.user, room);
			if (transferData.userId) {
				const userToTransfer = await Users.findOneById(transferData.userId);
				if (userToTransfer) {
					transferData.transferredTo = {
						_id: userToTransfer._id,
						username: userToTransfer.username,
						name: userToTransfer.name,
					};
				}
			}

			const chatForwardedResult = await transfer(room, guest, transferData);
			if (!chatForwardedResult) {
				throw new Error('error-forwarding-chat');
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room.join',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isLiveChatRoomJoinProps },
	{
		async get() {
			const { roomId } = this.queryParams;

			const { user } = this;

			if (!user) {
				throw new Error('error-invalid-user');
			}

			const room = await LivechatRooms.findOneById(roomId);

			if (!room) {
				throw new Error('error-invalid-room');
			}

			if (!room.open) {
				throw new Error('room-closed');
			}

			if (!(await Omnichannel.isWithinMACLimit(room))) {
				throw new Error('error-mac-limit-reached');
			}

			if (!(await canAccessRoomAsync(room, user))) {
				throw new Error('error-not-allowed');
			}

			await addUserToRoom(roomId, user);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room.saveInfo',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isLiveChatRoomSaveInfoProps },
	{
		async post() {
			const { roomData, guestData } = this.bodyParams;
			const room = await LivechatRooms.findOneById(roomData._id);
			if (!room || !isOmnichannelRoom(room)) {
				throw new Error('error-invalid-room');
			}

			if (
				(!room.servedBy || room.servedBy._id !== this.userId) &&
				!(await hasPermissionAsync(this.userId, 'save-others-livechat-room-info'))
			) {
				return API.v1.forbidden();
			}

			if (room.sms) {
				delete guestData.phone;
			}

			// We want this both operations to be concurrent, so we have to go with Promise.allSettled
			const result = await Promise.allSettled([saveGuest(guestData, this.userId), saveRoomInfo(roomData)]);

			const firstError = result.find((item) => item.status === 'rejected');
			if (firstError) {
				throw new Error((firstError as PromiseRejectedResult).reason.error);
			}

			await callbacks.run('livechat.saveInfo', await LivechatRooms.findOneById(roomData._id), {
				user: this.user,
				oldRoom: room,
			});

			return API.v1.success();
		},
	},
);
