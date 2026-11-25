import { VideoConf } from '@rocket.chat/core-services';
import type { VideoConferenceRoomWithOngoingCall } from '@rocket.chat/core-services';
import type { IUser, IVideoConferenceRoom } from '@rocket.chat/core-typings';
import {
	ajv,
	isVideoConfRoomCreateProps,
	isVideoConfRoomDeleteProps,
	isVideoConfRoomListProps,
	isVideoConfRoomRenameProps,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { canManageConferenceRoom } from '../../lib/videoConference/canManageConferenceRoom';
import { getConferenceStartRefusal } from '../../lib/videoConference/getConferenceStartRefusal';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const roomResponseSchema = ajv.compile<{ room: IVideoConferenceRoom }>({
	type: 'object',
	properties: {
		room: { $ref: '#/components/schemas/IVideoConferenceRoom' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['room', 'success'],
	additionalProperties: false,
});

const deleteResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const listResponseSchema = ajv.compile<{ rooms: VideoConferenceRoomWithOngoingCall[] }>({
	type: 'object',
	properties: {
		rooms: {
			type: 'array',
			items: {
				allOf: [
					{ $ref: '#/components/schemas/IVideoConferenceRoom' },
					{ type: 'object', properties: { ongoingCallId: { type: 'string' } } },
				],
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['rooms', 'success'],
	additionalProperties: false,
});

const linkWriteRateLimit = { numRequestsAllowed: 10, intervalTimeInMS: 60000 };

const errorResponses = {
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const assertCanManageLink = async (user: IUser, conferenceRoomId: IVideoConferenceRoom['_id']): Promise<void> => {
	const link = await VideoConf.getRoom(conferenceRoomId);
	if (!link) {
		throw new Error('error-invalid-conference-room');
	}

	if (!(await canManageConferenceRoom(user, link.rid))) {
		throw new Error('error-not-allowed');
	}
};

const videoConferenceRoomsEndpoints = API.v1
	.post(
		'video-conference.rooms.create',
		{
			authRequired: true,
			body: isVideoConfRoomCreateProps,
			rateLimiterOptions: linkWriteRateLimit,
			response: { 200: roomResponseSchema, ...errorResponses },
		},
		async function action() {
			const { roomId, title } = this.bodyParams;

			if (await getConferenceStartRefusal(this.user, roomId)) {
				throw new Error('error-not-allowed');
			}

			return API.v1.success({ room: await VideoConf.createRoom(this.userId, roomId, title) });
		},
	)
	.post(
		'video-conference.rooms.rename',
		{
			authRequired: true,
			body: isVideoConfRoomRenameProps,
			rateLimiterOptions: linkWriteRateLimit,
			response: { 200: roomResponseSchema, ...errorResponses },
		},
		async function action() {
			const { conferenceRoomId, title } = this.bodyParams;

			await assertCanManageLink(this.user, conferenceRoomId);

			return API.v1.success({ room: await VideoConf.renameRoom(conferenceRoomId, title) });
		},
	)
	.post(
		'video-conference.rooms.delete',
		{
			authRequired: true,
			body: isVideoConfRoomDeleteProps,
			rateLimiterOptions: linkWriteRateLimit,
			response: { 200: deleteResponseSchema, ...errorResponses },
		},
		async function action() {
			const { conferenceRoomId } = this.bodyParams;

			await assertCanManageLink(this.user, conferenceRoomId);
			await VideoConf.deleteRoom(conferenceRoomId);

			return API.v1.success();
		},
	)
	.get(
		'video-conference.rooms.list',
		{
			authRequired: true,
			query: isVideoConfRoomListProps,
			rateLimiterOptions: { numRequestsAllowed: 15, intervalTimeInMS: 3000 },
			response: { 200: listResponseSchema, ...errorResponses },
		},
		async function action() {
			const { roomId } = this.queryParams;

			if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
				throw new Error('error-not-allowed');
			}

			return API.v1.success({ rooms: await VideoConf.listRooms(roomId) });
		},
	);

type VideoConferenceRoomsEndpoints = ExtractRoutesFromAPI<typeof videoConferenceRoomsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type
	interface Endpoints extends VideoConferenceRoomsEndpoints {}
}
