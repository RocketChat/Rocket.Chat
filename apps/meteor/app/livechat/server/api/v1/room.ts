import type { ILivechatAgent, IOmnichannelRoom, IUser, SelectedAgent, TransferByData } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users, LivechatRooms, Subscriptions, Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import {
	isLiveChatRoomForwardProps,
	isPOSTLivechatRoomCloseParams,
	isPOSTLivechatRoomTransferParams,
	isPOSTLivechatRoomSurveyParams,
	isLiveChatRoomJoinProps,
	isPUTLivechatRoomVisitorParams,
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
import { settings as rcSettings } from '../../../../settings/server';
import { normalizeTransferredByData } from '../../lib/Helper';
import { Livechat } from '../../lib/Livechat';
import type { CloseRoomParams } from '../../lib/LivechatTyped';
import { Livechat as LivechatTyped } from '../../lib/LivechatTyped';
import { findGuest, findRoom, getRoom, settings, findAgent, onCheckRoomParams } from '../lib/livechat';
import { findVisitorInfo } from '../lib/visitors';

const isAgentWithInfo = (agentObj: ILivechatAgent | { hiddenInfo: boolean }): agentObj is ILivechatAgent => !('hiddenInfo' in agentObj);

API.v1.addRoute('livechat/room', {
	async get() {
		// I'll temporary use check for validation, as validateParams doesnt support what's being done here
		const extraCheckParams = await onCheckRoomParams({
			token: String,
			rid: Match.Maybe(String),
			agentId: Match.Maybe(String),
		});

		check(this.queryParams, extraCheckParams as any);

		const { token, rid: roomId, agentId, ...extraParams } = this.queryParams;

		const guest = token && (await findGuest(token));
		if (!guest) {
			throw new Error('invalid-token');
		}

		let room: IOmnichannelRoom | null;
		if (!roomId) {
			room = await LivechatRooms.findOneOpenByVisitorToken(token, {});
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

			const rid = Random.id();
			const roomInfo = {
				source: {
					type: isWidget(this.request.headers) ? OmnichannelSourceType.WIDGET : OmnichannelSourceType.API,
				},
			};

			const newRoom = await getRoom({ guest, rid, agent, roomInfo, extraParams });
			return API.v1.success(newRoom);
		}

		const froom = await LivechatRooms.findOneOpenByRoomIdAndVisitorToken(roomId, token, {});
		if (!froom) {
			throw new Error('invalid-room');
		}

		return API.v1.success({ room: froom, newRoom: false });
	},
});

// Note: use this route if a visitor is closing a room
// If a RC user(like eg agent) is closing a room, use the `livechat/room.closeByUser` route
API.v1.addRoute(
	'livechat/room.close',
	{ validateParams: isPOSTLivechatRoomCloseParams },
	{
		async post() {
			const { rid, token } = this.bodyParams;

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
					const t = (s: string): string => i18n.t(s, { lng: language });
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

			await LivechatTyped.closeRoom({ visitor, room, comment, options });

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
			const { rid, comment, tags, generateTranscriptPdf, transcriptEmail } = this.bodyParams;

			const room = await LivechatRooms.findOneById(rid);
			if (!room || !isOmnichannelRoom(room)) {
				throw new Error('error-invalid-room');
			}

			if (!room.open) {
				throw new Error('error-room-already-closed');
			}

			const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, this.userId, { projection: { _id: 1 } });
			if (!subscription && !(await hasPermissionAsync(this.userId, 'close-others-livechat-room'))) {
				throw new Error('error-not-authorized');
			}

			const options: CloseRoomParams['options'] = {
				clientAction: true,
				tags,
				...(generateTranscriptPdf && { pdfTranscript: { requestedBy: this.userId } }),
				...(transcriptEmail && {
					...(transcriptEmail.sendToVisitor
						? {
								emailTranscript: {
									sendToVisitor: true,
									requestData: {
										email: transcriptEmail.requestData.email,
										subject: transcriptEmail.requestData.subject,
										requestedAt: new Date(),
										requestedBy: this.user,
									},
								},
						  }
						: {
								emailTranscript: {
									sendToVisitor: false,
								},
						  }),
				}),
			};

			await LivechatTyped.closeRoom({
				room,
				user: this.user,
				options,
				comment,
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room.transfer',
	{ validateParams: isPOSTLivechatRoomTransferParams, deprecationVersion: '7.0.0' },
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

			if (!(await Livechat.transfer(room, guest, { roomId: rid, departmentId: department, transferredBy }))) {
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
			const transferData: typeof this.bodyParams & {
				transferredBy?: unknown;
				transferredTo?: { _id: string; username?: string; name?: string };
			} = this.bodyParams;

			const room = await LivechatRooms.findOneById(this.bodyParams.roomId);
			if (!room || room.t !== 'l') {
				throw new Error('error-invalid-room');
			}

			if (!room.open) {
				throw new Error('This_conversation_is_already_closed');
			}

			const guest = await LivechatVisitors.findOneById(room.v?._id);
			const transferedBy = this.user satisfies TransferByData;
			transferData.transferredBy = normalizeTransferredByData(transferedBy, room);
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

			const chatForwardedResult = await Livechat.transfer(room, guest, transferData);
			if (!chatForwardedResult) {
				throw new Error('error-forwarding-chat');
			}

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'livechat/room.visitor',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isPUTLivechatRoomVisitorParams, deprecationVersion: '7.0.0' },
	{
		async put() {
			// This endpoint is deprecated and will be removed in future versions.
			const { rid, newVisitorId, oldVisitorId } = this.bodyParams;

			const { visitor } = await findVisitorInfo({ visitorId: newVisitorId });
			if (!visitor) {
				throw new Error('invalid-visitor');
			}

			const room = await LivechatRooms.findOneById(rid, { _id: 1, v: 1 }); // TODO: check _id
			if (!room) {
				throw new Error('invalid-room');
			}

			const { v: { _id: roomVisitorId = undefined } = {} } = room; // TODO: v it will be undefined
			if (roomVisitorId !== oldVisitorId) {
				throw new Error('invalid-room-visitor');
			}

			const roomAfterChange = await Livechat.changeRoomVisitor(this.userId, rid, visitor);

			if (!roomAfterChange) {
				return API.v1.failure();
			}

			return API.v1.success({ room: roomAfterChange });
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
				return API.v1.unauthorized();
			}

			if (room.sms) {
				delete guestData.phone;
			}

			// We want this both operations to be concurrent, so we have to go with Promise.allSettled
			const result = await Promise.allSettled([Livechat.saveGuest(guestData, this.userId), Livechat.saveRoomInfo(roomData)]);

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
