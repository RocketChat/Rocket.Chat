import { FederationMatrix, MeteorError, Team } from '@rocket.chat/core-services';
import {
	type IRoom,
	type IUpload,
	type RequiredField,
	type RoomAdminFieldsType,
	isPrivateRoom,
	isPublicRoom,
	type IUser,
} from '@rocket.chat/core-typings';
import { Messages, Rooms, Users, Uploads, Subscriptions } from '@rocket.chat/models';
import type { Notifications } from '@rocket.chat/rest-typings';
import {
	ajv,
	ajvQuery,
	isGETRoomsNameExists,
	isRoomsImagesProps,
	isRoomsMuteUnmuteUserProps,
	isRoomsBanUserProps,
	isRoomsUnbanUserProps,
	isRoomsBannedUsersProps,
	isRoomsExportProps,
	isRoomsIsMemberProps,
	isRoomsCleanHistoryProps,
	isRoomsOpenProps,
	isRoomsMembersOrderedByRoleProps,
	isRoomsChangeArchivationStateProps,
	isRoomsHideProps,
	isRoomsInviteProps,
	isRoomsCreateDiscussionProps,
	isRoomsAdminRoomsProps,
	isRoomsAutocompleteAdminRoomsPayload,
	isRoomsAdminRoomsGetRoomProps,
	isRoomsAutoCompleteChannelAndPrivateProps,
	isRoomsAutocompleteChannelAndPrivateWithPaginationProps,
	isRoomsAutocompleteAvailableForTeamsProps,
	isRoomsSaveRoomSettingsProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
} from '@rocket.chat/rest-typings';
import { isTruthy } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

import { adminFields } from '../../../../lib/rooms/adminFields';
import { omit } from '../../../../lib/utils/omit';
import { banUserFromRoomMethod } from '../../../../server/lib/banUserFromRoom';
import * as dataExport from '../../../../server/lib/dataExport';
import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { findUsersOfRoomOrderedByRole } from '../../../../server/lib/findUsersOfRoomOrderedByRole';
import { openRoom } from '../../../../server/lib/openRoom';
import type { RoomRoles } from '../../../../server/lib/roles/getRoomRoles';
import { unbanUserFromRoom } from '../../../../server/lib/unbanUserFromRoom';
import { hideRoomMethod } from '../../../../server/methods/hideRoom';
import { muteUserInRoom } from '../../../../server/methods/muteUserInRoom';
import { toggleFavoriteMethod } from '../../../../server/methods/toggleFavorite';
import { unmuteUserInRoom } from '../../../../server/methods/unmuteUserInRoom';
import { roomsGetMethod } from '../../../../server/publications/room';
import { canAccessRoomAsync, canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { saveRoomSettings } from '../../../channel-settings/server/methods/saveRoomSettings';
import { createDiscussion } from '../../../discussion/server/methods/createDiscussion';
import { FileUpload } from '../../../file-upload/server';
import { sendFileMessage } from '../../../file-upload/server/methods/sendFileMessage';
import { syncRolePrioritiesForRoomIfRequired } from '../../../lib/server/functions/syncRolePrioritiesForRoomIfRequired';
import { executeArchiveRoom } from '../../../lib/server/methods/archiveRoom';
import { cleanRoomHistoryMethod } from '../../../lib/server/methods/cleanRoomHistory';
import { executeGetRoomRoles } from '../../../lib/server/methods/getRoomRoles';
import { leaveRoomMethod } from '../../../lib/server/methods/leaveRoom';
import { executeUnarchiveRoom } from '../../../lib/server/methods/unarchiveRoom';
import { applyAirGappedRestrictionsValidation } from '../../../license/server/airGappedRestrictionsWrapper';
import type { NotificationFieldType } from '../../../push-notifications/server/methods/saveNotificationSettings';
import { saveNotificationSettingsMethod } from '../../../push-notifications/server/methods/saveNotificationSettings';
import { settings } from '../../../settings/server';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams } from '../helpers/getUserFromParams';
import { MultipartUploadHandler } from '../lib/MultipartUploadHandler';
import {
	findAdminRoom,
	findAdminRooms,
	findAdminRoomsAutocomplete,
	findChannelAndPrivateAutocomplete,
	findChannelAndPrivateAutocompleteWithPagination,
	findRoomsAvailableForTeams,
} from '../lib/rooms';

export async function findRoomByIdOrName({
	params,
	checkedArchived = true,
}: {
	params:
		| {
				roomId?: string;
		  }
		| {
				roomName?: string;
		  };
	checkedArchived?: boolean;
}): Promise<IRoom> {
	if (
		(!('roomId' in params) && !('roomName' in params)) ||
		('roomId' in params && !(params as { roomId?: string }).roomId && 'roomName' in params && !(params as { roomName?: string }).roomName)
	) {
		throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const projection = { ...API.v1.defaultFieldsToExclude };

	let room;
	if ('roomId' in params) {
		room = await Rooms.findOneById(params.roomId || '', { projection });
	} else if ('roomName' in params) {
		room = await Rooms.findOneByName(params.roomName || '', { projection });
	}

	if (!room) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
	}
	if (checkedArchived && room.archived) {
		throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
	}

	return room;
}

API.v1.get(
	'rooms.nameExists',
	{
		authRequired: true,
		query: isGETRoomsNameExists,
		response: {
			200: ajv.compile<{ exists: boolean }>({
				type: 'object',
				properties: {
					exists: { type: 'boolean' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['exists', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomName } = this.queryParams;

		const room = await Rooms.findOneByName(roomName, { projection: { _id: 1 } });

		return API.v1.success({ exists: !!room });
	},
);

const roomDeleteEndpoint = API.v1.post(
	'rooms.delete',
	{
		authRequired: true,
		body: ajv.compile<{ roomId: string }>({
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
					description: 'The ID of the room to delete.',
				},
			},
			required: ['roomId'],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [true],
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId } = this.bodyParams;

		const room = await Rooms.findOneById(roomId);

		if (!room) {
			throw new MeteorError('error-invalid-room', 'Invalid room', {
				method: 'eraseRoom',
			});
		}

		if (room.teamMain) {
			throw new Meteor.Error('error-cannot-delete-team-channel', 'Cannot delete a team channel', {
				method: 'eraseRoom',
			});
		}

		await eraseRoom(room, this.user);

		return API.v1.success();
	},
);

API.v1.get(
	'rooms.get',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{ update: IRoom[]; remove: IRoom[] }>({
				type: 'object',
				properties: {
					update: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom composed with lastMessage
					remove: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom composed with lastMessage
					success: { type: 'boolean', enum: [true] },
				},
				required: ['update', 'remove', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { updatedSince } = this.queryParams;

		let updatedSinceDate;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
		}

		let result = await roomsGetMethod(this.userId, updatedSinceDate);

		if (Array.isArray(result)) {
			result = {
				update: result,
				remove: [],
			};
		}

		return API.v1.success({
			update: await Promise.all(result.update.map((room) => composeRoomWithLastMessage(room, this.userId))),
			remove: await Promise.all(result.remove.map((room) => composeRoomWithLastMessage(room, this.userId))),
		});
	},
);

API.v1.addRoute(
	'rooms.media/:rid',
	{ authRequired: true },
	{
		async post() {
			if (!(await canAccessRoomIdAsync(this.urlParams.rid, this.userId))) {
				return API.v1.forbidden();
			}

			const { file, fields } = await MultipartUploadHandler.parseRequest(this.incoming, {
				field: 'file',
				maxSize: settings.get<number>('FileUpload_MaxFileSize'),
			});

			if (!file) {
				throw new Meteor.Error('error-no-file-uploaded', 'No file was uploaded');
			}

			const expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours() + 24);

			let content;

			if (fields.content) {
				try {
					content = JSON.parse(fields.content);
				} catch (e) {
					console.error(e);
					throw new Meteor.Error('invalid-field-content');
				}
			}

			const details = {
				name: file.filename,
				size: file.size,
				type: file.mimetype,
				rid: this.urlParams.rid,
				userId: this.userId,
				content,
				expiresAt,
			};

			// TODO: In the future, we should isolate file receival from storage and post-processing.
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = await fileStore.insert(details, file.tempFilePath);

			uploadedFile.path = FileUpload.getPath(`${uploadedFile._id}/${encodeURI(uploadedFile.name || '')}`);

			await Uploads.updateFileComplete(uploadedFile._id, this.userId, omit(uploadedFile, '_id'));

			return API.v1.success({
				file: {
					_id: uploadedFile._id,
					url: uploadedFile.path,
				},
			});
		},
	},
);

API.v1.addRoute(
	'rooms.mediaConfirm/:rid/:fileId',
	{ authRequired: true },
	{
		async post() {
			if (!(await canAccessRoomIdAsync(this.urlParams.rid, this.userId))) {
				return API.v1.forbidden();
			}

			const file = await Uploads.findOneByIdAndUserIdAndRoomId(this.urlParams.fileId, this.userId, this.urlParams.rid);

			if (!file) {
				throw new Meteor.Error('invalid-file');
			}

			if ((this.bodyParams.description?.length ?? 0) > settings.get<number>('Message_MaxAllowedSize')) {
				throw new Meteor.Error('error-message-size-exceeded');
			}

			file.description = this.bodyParams.description;
			delete this.bodyParams.description;

			if (this.bodyParams.fileName) {
				file.name = this.bodyParams.fileName;
				delete this.bodyParams.fileName;
			}

			if (this.bodyParams.fileContent) {
				file.content = this.bodyParams.fileContent;
				delete this.bodyParams.fileContent;
			}

			await applyAirGappedRestrictionsValidation(() =>
				sendFileMessage(this.userId, { roomId: this.urlParams.rid, file, msgData: this.bodyParams }),
			);

			await Uploads.confirmTemporaryFile(this.urlParams.fileId, this.userId);

			const message = await Messages.getMessageByFileIdAndUsername(file._id, this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

const saveNotificationBodySchema = ajv.compile<{
	roomId: string;
	notifications: Record<string, string>;
}>({
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		notifications: {
			type: 'object',
			minProperties: 1,
			additionalProperties: { type: 'string' },
		},
	},
	required: ['roomId', 'notifications'],
	additionalProperties: false,
});

const saveNotificationResponseSchema = ajv.compile({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const roomsSaveNotificationEndpoint = API.v1.post(
	'rooms.saveNotification',
	{
		authRequired: true,
		body: saveNotificationBodySchema,
		response: {
			200: saveNotificationResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId, notifications } = this.bodyParams;

		await Promise.all(
			Object.entries(notifications as Notifications).map(async ([notificationKey, notificationValue]) =>
				saveNotificationSettingsMethod(this.userId, roomId, notificationKey as NotificationFieldType, notificationValue),
			),
		);

		return API.v1.success({ success: true });
	},
);

API.v1.post(
	'rooms.cleanHistory',
	{
		authRequired: true,
		body: isRoomsCleanHistoryProps,
		response: {
			200: ajv.compile<{ _id: string; count: number }>({
				type: 'object',
				properties: {
					_id: { type: 'string' },
					count: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['_id', 'count', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const room = await findRoomByIdOrName({ params: this.bodyParams });
		const { _id } = room;

		if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
			return API.v1.failure('User does not have access to the room [error-not-allowed]', 'error-not-allowed');
		}

		const { latest, oldest, inclusive = false, limit, excludePinned, filesOnly, ignoreThreads, ignoreDiscussion, users } = this.bodyParams;

		const count = await cleanRoomHistoryMethod(this.userId, {
			roomId: _id,
			latest: new Date(latest),
			oldest: new Date(oldest),
			inclusive,
			limit,
			excludePinned: [true, 'true', 1, '1'].includes(excludePinned ?? false),
			filesOnly: [true, 'true', 1, '1'].includes(filesOnly ?? false),
			ignoreThreads: [true, 'true', 1, '1'].includes(ignoreThreads ?? false),
			ignoreDiscussion: [true, 'true', 1, '1'].includes(ignoreDiscussion ?? false),
			fromUsers: users?.filter(isTruthy) || [],
		});

		return API.v1.success({ _id, count });
	},
);

API.v1.get(
	'rooms.info',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{ room: IRoom | null }>({
				type: 'object',
				properties: {
					room: { type: ['object', 'null'] },
					team: { type: 'object' },
					parent: { type: 'object' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['room', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const room = await findRoomByIdOrName({ params: this.queryParams });
		const { fields } = await this.parseJsonQuery();

		if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
			return API.v1.failure('not-allowed', 'Not Allowed');
		}

		const discussionParent =
			room.prid &&
			(await Rooms.findOneById<Pick<IRoom, 'name' | 'fname' | 't' | 'prid' | 'u'>>(room.prid, {
				projection: { name: 1, fname: 1, t: 1, prid: 1, u: 1 },
			}));
		const { team, parentRoom } = await Team.getRoomInfo(room);
		const parent = discussionParent || parentRoom;

		return API.v1.success({
			room: await Rooms.findOneByIdOrName(room._id, { projection: fields }),
			...(team && { team }),
			...(parent && { parent }),
		});
	},
);

API.v1.post(
	'rooms.createDiscussion',
	{
		authRequired: true,
		body: isRoomsCreateDiscussionProps,
		response: {
			200: ajv.compile<{ discussion: IRoom }>({
				type: 'object',
				properties: {
					discussion: { type: 'object' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['discussion', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { prid, pmid, reply, t_name, users, encrypted, topic } = this.bodyParams;

		const discussion = await applyAirGappedRestrictionsValidation(() =>
			createDiscussion(this.userId, {
				prid,
				pmid,
				t_name,
				reply,
				users: users?.filter(isTruthy) || [],
				encrypted,
				topic,
			}),
		);

		return API.v1.success({ discussion });
	},
);

API.v1.get(
	'rooms.getDiscussions',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{ discussions: IRoom[]; count: number; offset: number; total: number }>({
				type: 'object',
				properties: {
					discussions: { type: 'array', items: { type: 'object' } }, // relaxed: discussions have extra room fields
					count: { type: 'number' },
					offset: { type: 'number' },
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['discussions', 'count', 'offset', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const room = await findRoomByIdOrName({ params: this.queryParams });
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
			return API.v1.failure('not-allowed', 'Not Allowed');
		}

		const ourQuery = Object.assign(query, { prid: room._id });

		const { cursor, totalCount } = await Rooms.findPaginated(ourQuery, {
			sort: sort || { fname: 1 },
			skip: offset,
			limit: count,
			projection: fields,
		});

		const [discussions, total] = await Promise.all([cursor.toArray(), totalCount]);

		return API.v1.success({
			discussions,
			count: discussions.length,
			offset,
			total,
		});
	},
);

API.v1.get(
	'rooms.images',
	{
		authRequired: true,
		query: isRoomsImagesProps,
		response: {
			200: ajv.compile<{ files: IUpload[]; count: number; offset: number; total: number }>({
				type: 'object',
				properties: {
					files: { type: 'array', items: { type: 'object' } }, // relaxed: IUpload with user transform
					count: { type: 'number' },
					offset: { type: 'number' },
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['files', 'count', 'offset', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'teamId' | 'prid'>>(this.queryParams.roomId, {
			projection: { t: 1, teamId: 1, prid: 1 },
		});

		if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
			return API.v1.forbidden();
		}

		let initialImage: IUpload | null = null;
		if (this.queryParams.startingFromId) {
			initialImage = await Uploads.findOneById(this.queryParams.startingFromId);
			if (initialImage && initialImage.rid !== room._id) {
				initialImage = null;
			}
		}

		const { offset, count } = await getPaginationItems(this.queryParams);

		const { cursor, totalCount } = Uploads.findImagesByRoomId(room._id, initialImage?.uploadedAt, {
			skip: offset,
			limit: count,
		});

		const [files, total] = await Promise.all([cursor.toArray(), totalCount]);

		// If the initial image was not returned in the query, insert it as the first element of the list
		if (initialImage && !files.find(({ _id }) => _id === initialImage._id)) {
			files.splice(0, 0, initialImage);
		}

		return API.v1.success({
			files,
			count,
			offset,
			total,
		});
	},
);

API.v1.get(
	'rooms.adminRooms',
	{
		authRequired: true,
		query: isRoomsAdminRoomsProps,
		response: {
			200: ajv.compile<{ rooms: IRoom[]; count: number; offset: number; total: number }>({
				type: 'object',
				properties: {
					rooms: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom with admin fields
					count: { type: 'number' },
					offset: { type: 'number' },
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['rooms', 'count', 'offset', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();
		const { types, filter } = this.queryParams;

		return API.v1.success(
			await findAdminRooms({
				uid: this.userId,
				filter: filter || '',
				types: types ?? [],
				pagination: {
					offset,
					count,
					sort,
				},
			}),
		);
	},
);

API.v1.get(
	'rooms.autocomplete.adminRooms',
	{
		authRequired: true,
		query: isRoomsAutocompleteAdminRoomsPayload,
		response: {
			200: ajv.compile<{ items: IRoom[] }>({
				type: 'object',
				properties: {
					items: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom autocomplete subset
					success: { type: 'boolean', enum: [true] },
				},
				required: ['items', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { selector } = this.queryParams;

		return API.v1.success(
			await findAdminRoomsAutocomplete({
				uid: this.userId,
				selector: JSON.parse(selector),
			}),
		);
	},
);

API.v1.get(
	'rooms.adminRooms.getRoom',
	{
		authRequired: true,
		query: isRoomsAdminRoomsGetRoomProps,
		response: {
			200: ajv.compile<Pick<IRoom, RoomAdminFieldsType>>({
				allOf: [
					{ $ref: '#/components/schemas/IRoomAdmin' },
					{ type: 'object', properties: { success: { type: 'boolean', enum: [true] } }, required: ['success'] },
				],
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { rid } = this.queryParams;
		const room = await findAdminRoom({
			uid: this.userId,
			rid: rid || '',
		});

		if (!room) {
			return API.v1.failure('not-allowed', 'Not Allowed');
		}
		return API.v1.success(room);
	},
);

API.v1.get(
	'rooms.autocomplete.channelAndPrivate',
	{
		authRequired: true,
		query: isRoomsAutoCompleteChannelAndPrivateProps,
		response: {
			200: ajv.compile<{ items: IRoom[] }>({
				type: 'object',
				properties: {
					items: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom autocomplete subset
					success: { type: 'boolean', enum: [true] },
				},
				required: ['items', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { selector } = this.queryParams;

		return API.v1.success(
			await findChannelAndPrivateAutocomplete({
				uid: this.userId,
				selector: JSON.parse(selector),
			}),
		);
	},
);

API.v1.get(
	'rooms.autocomplete.channelAndPrivate.withPagination',
	{
		authRequired: true,
		query: isRoomsAutocompleteChannelAndPrivateWithPaginationProps,
		response: {
			200: ajv.compile<{ items: IRoom[]; total: number }>({
				type: 'object',
				properties: {
					items: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom autocomplete subset
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['items', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { selector } = this.queryParams;
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();

		return API.v1.success(
			await findChannelAndPrivateAutocompleteWithPagination({
				uid: this.userId,
				selector: JSON.parse(selector),
				pagination: {
					offset,
					count,
					sort,
				},
			}),
		);
	},
);

API.v1.get(
	'rooms.autocomplete.availableForTeams',
	{
		authRequired: true,
		query: isRoomsAutocompleteAvailableForTeamsProps,
		response: {
			200: ajv.compile<{ items: IRoom[] }>({
				type: 'object',
				properties: {
					items: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom autocomplete subset
					success: { type: 'boolean', enum: [true] },
				},
				required: ['items', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { name } = this.queryParams;

		return API.v1.success(
			await findRoomsAvailableForTeams({
				uid: this.userId,
				name,
			}),
		);
	},
);

API.v1.post(
	'rooms.saveRoomSettings',
	{
		authRequired: true,
		body: isRoomsSaveRoomSettingsProps,
		response: {
			200: ajv.compile<{ rid: string }>({
				type: 'object',
				properties: {
					rid: { type: 'string' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['rid', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { rid, ...params } = this.bodyParams;

		const result = await saveRoomSettings(this.userId, rid, params);

		return API.v1.success({ rid: result.rid });
	},
);

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'rooms.changeArchivationState',
	{
		authRequired: true,
		body: isRoomsChangeArchivationStateProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { rid, action } = this.bodyParams;

		if (action === 'archive') {
			await executeArchiveRoom(this.userId, rid);
		} else {
			await executeUnarchiveRoom(this.userId, rid);
		}

		return API.v1.success();
	},
);

API.v1.post(
	'rooms.export',
	{
		authRequired: true,
		body: isRoomsExportProps,
		response: {
			200: ajv.compile<void | { missing: string[] }>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
					missing: { type: 'array', items: { type: 'string' } },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { rid, type } = this.bodyParams;

		if (!(await hasPermissionAsync(this.userId, 'mail-messages', rid))) {
			throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed');
		}

		const room = await Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room');
		}

		const user = await Users.findOneById(this.userId);

		if (!user || !(await canAccessRoomAsync(room, user))) {
			throw new Meteor.Error('error-not-allowed', 'Not Allowed');
		}

		if (type === 'file') {
			const { dateFrom, dateTo } = this.bodyParams;
			const { format } = this.bodyParams;

			const convertedDateFrom = dateFrom ? new Date(dateFrom) : new Date(0);
			const convertedDateTo = dateTo ? new Date(dateTo) : new Date();
			convertedDateTo.setDate(convertedDateTo.getDate() + 1);

			if (convertedDateFrom > convertedDateTo) {
				throw new Meteor.Error('error-invalid-dates', 'From date cannot be after To date');
			}

			void dataExport.sendFile(
				{
					rid,
					format,
					dateFrom: convertedDateFrom,
					dateTo: convertedDateTo,
				},
				user,
			);
			return API.v1.success();
		}

		if (type === 'email') {
			const { toUsers, toEmails, subject, messages } = this.bodyParams;

			if ((!toUsers || toUsers.length === 0) && (!toEmails || toEmails.length === 0)) {
				throw new Meteor.Error('error-invalid-recipient');
			}

			const result = await dataExport.sendViaEmail(
				{
					rid,
					toUsers: (toUsers as string[]) || [],
					toEmails: toEmails || [],
					subject: subject || '',
					messages: messages || [],
					language: user.language || 'en',
				},
				user,
			);

			return API.v1.success(result);
		}

		return API.v1.failure();
	},
);

API.v1.get(
	'rooms.isMember',
	{
		authRequired: true,
		query: isRoomsIsMemberProps,
		response: {
			200: ajv.compile<{ isMember: boolean }>({
				type: 'object',
				properties: {
					isMember: { type: 'boolean' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['isMember', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { roomId } = this.queryParams;
		const usernameOrUserId = 'userId' in this.queryParams ? this.queryParams.userId : this.queryParams.username;
		const [room, user] = await Promise.all([
			findRoomByIdOrName({
				params: { roomId },
			}),
			Users.findOneByIdOrUsername(usernameOrUserId),
		]);

		if (!user?._id) {
			return API.v1.failure('error-user-not-found');
		}

		if (await canAccessRoomAsync(room, { _id: this.user._id })) {
			return API.v1.success({
				isMember: (await Subscriptions.countByRoomIdAndUserId(room._id, user._id)) > 0,
			});
		}
		return API.v1.forbidden();
	},
);

API.v1.get(
	'rooms.membersOrderedByRole',
	{
		authRequired: true,
		query: isRoomsMembersOrderedByRoleProps,
		response: {
			200: ajv.compile<{ members: IUser[]; count: number; offset: number; total: number }>({
				type: 'object',
				properties: {
					members: { type: 'array', items: { type: 'object' } }, // relaxed: projected IUser with role priority
					count: { type: 'number' },
					offset: { type: 'number' },
					total: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['members', 'count', 'offset', 'total', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const findResult = await findRoomByIdOrName({
			params: this.queryParams,
			checkedArchived: false,
		});

		if (!(await canAccessRoomAsync(findResult, this.user))) {
			return API.v1.notFound('The required "roomId" or "roomName" param provided does not match any room');
		}

		if (!isPublicRoom(findResult) && !isPrivateRoom(findResult)) {
			return API.v1.failure('error-room-type-not-supported');
		}

		if (findResult.broadcast && !(await hasPermissionAsync(this.userId, 'view-broadcast-member-list', findResult._id))) {
			return API.v1.unauthorized();
		}

		// Ensures that role priorities for the specified room are synchronized correctly.
		// This function acts as a soft migration. If the `roomRolePriorities` field
		// for the room has already been created and is up-to-date, no updates will be performed.
		// If not, it will synchronize the role priorities of the users of the room.
		await syncRolePrioritiesForRoomIfRequired(findResult._id);

		const { offset: skip, count: limit } = await getPaginationItems(this.queryParams);
		const { sort = {} } = await this.parseJsonQuery();

		const { status, filter } = this.queryParams;

		const { members, total } = await findUsersOfRoomOrderedByRole({
			rid: findResult._id,
			...(status && { status: { $in: status } }),
			skip,
			limit,
			filter,
			sort,
		});

		return API.v1.success({
			members,
			count: members.length,
			offset: skip,
			total,
		});
	},
);

API.v1.post(
	'rooms.muteUser',
	{
		authRequired: true,
		body: isRoomsMuteUnmuteUserProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const user = await getUserFromParams(this.bodyParams);

		if (!user.username) {
			return API.v1.failure('Invalid user');
		}

		await muteUserInRoom(this.userId, { rid: this.bodyParams.roomId, username: user.username });

		return API.v1.success();
	},
);

API.v1.post(
	'rooms.unmuteUser',
	{
		authRequired: true,
		body: isRoomsMuteUnmuteUserProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const user = await getUserFromParams(this.bodyParams);

		if (!user.username) {
			return API.v1.failure('Invalid user');
		}

		await unmuteUserInRoom(this.userId, { rid: this.bodyParams.roomId, username: user.username });

		return API.v1.success();
	},
);

API.v1.post(
	'rooms.open',
	{
		authRequired: true,
		body: isRoomsOpenProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId } = this.bodyParams;

		await openRoom(this.userId, roomId);

		return API.v1.success();
	},
);

API.v1.post(
	'rooms.hide',
	{
		authRequired: true,
		body: isRoomsHideProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { roomId } = this.bodyParams;

		if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
			return API.v1.unauthorized();
		}

		const user = await Users.findOneById(this.userId, { projections: { _id: 1 } });

		if (!user) {
			return API.v1.failure('error-invalid-user');
		}

		const modCount = await hideRoomMethod(this.userId, roomId);

		if (!modCount) {
			return API.v1.failure('error-room-already-hidden');
		}

		return API.v1.success();
	},
);

type RoomsFavorite =
	| {
			roomId: string;
			favorite: boolean;
	  }
	| {
			roomName: string;
			favorite: boolean;
	  };

type RoomsLeave =
	| {
			roomId: string;
	  }
	| {
			roomName: string;
	  };

const isRoomGetRolesPropsSchema = {
	type: 'object',
	properties: {
		rid: { type: 'string' },
	},
	additionalProperties: false,
	required: ['rid'],
};

const RoomsFavoriteSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				favorite: { type: 'boolean' },
				roomName: { type: 'string' },
			},
			required: ['roomName', 'favorite'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				favorite: { type: 'boolean' },
				roomId: { type: 'string' },
			},
			required: ['roomId', 'favorite'],
			additionalProperties: false,
		},
	],
};

const isRoomsLeavePropsSchema = {
	anyOf: [
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: { type: 'string' },
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

const isRoomsFavoriteProps = ajv.compile<RoomsFavorite>(RoomsFavoriteSchema);
const isRoomsLeaveProps = ajv.compile<RoomsLeave>(isRoomsLeavePropsSchema);
const roomsBannedUsersResponseSchema = ajv.compile<{
	success: true;
	bannedUsers: RequiredField<Pick<IUser, '_id' | 'username' | 'name'>, '_id' | 'username'>[];
	count: number;
	offset: number;
	total: number;
}>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		bannedUsers: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					username: { type: 'string' },
					name: { type: 'string' },
				},
				required: ['_id', 'username'],
				additionalProperties: false,
			},
		},
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
	},
	required: ['success', 'bannedUsers', 'count', 'offset', 'total'],
	additionalProperties: false,
});

export const roomEndpoints = API.v1
	.get(
		'rooms.roles',
		{
			authRequired: true,
			query: ajvQuery.compile<{
				rid: string;
			}>(isRoomGetRolesPropsSchema),
			response: {
				200: ajv.compile<{
					roles: RoomRoles[];
				}>({
					type: 'object',
					properties: {
						roles: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									rid: { type: 'string' },
									u: {
										type: 'object',
										properties: { _id: { type: 'string' }, username: { type: 'string' } },
										required: ['_id', 'username'],
									},
									roles: { type: 'array', items: { type: 'string' } },
								},
								required: ['rid', 'u', 'roles'],
							},
						},
					},
					required: ['roles'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function () {
			const { rid } = this.queryParams;
			const roles = await executeGetRoomRoles(rid, this.user);

			return API.v1.success({
				roles,
			});
		},
	)
	.get(
		'rooms.adminRooms.privateRooms',
		{
			authRequired: true,
			permissionsRequired: ['view-room-administration'],
			query: ajvQuery.compile<{
				filter?: string;
				offset?: number;
				count?: number;
				sort?: string;
			}>({
				type: 'object',
				properties: {
					filter: { type: 'string' },
					offset: { type: 'number' },
					count: { type: 'number' },
					sort: { type: 'string' },
				},
				additionalProperties: true,
			}),
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateUnauthorizedErrorResponse,
				200: ajv.compile<{
					rooms: IRoom[];
					count: number;
					offset: number;
					total: number;
				}>({
					type: 'object',
					properties: {
						rooms: {
							type: 'array',
							items: { type: 'object' }, // relaxed: IRoom subset
						},
						count: { type: 'number' },
						offset: { type: 'number' },
						total: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['rooms', 'count', 'offset', 'total', 'success'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { filter } = this.queryParams;

			const name = (filter || '').trim();

			const { cursor, totalCount } = Rooms.findPrivateRoomsAndTeamsPaginated(name, {
				skip: offset,
				limit: count,
				sort: sort || { default: -1, name: 1 },
				projection: adminFields,
			});

			const [rooms, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				rooms,
				count: rooms.length,
				offset,
				total,
			});
		},
	)
	.post(
		'rooms.invite',
		{
			authRequired: true,
			body: isRoomsInviteProps,
			response: {
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const { roomId, action } = this.bodyParams;

			try {
				await FederationMatrix.handleInvite(roomId, this.userId, action);
				return API.v1.success();
			} catch (error) {
				return API.v1.failure({ error: `Failed to handle invite: ${error instanceof Error ? error.message : String(error)}` });
			}
		},
	)
	.post(
		'rooms.favorite',
		{
			authRequired: true,
			body: isRoomsFavoriteProps,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							enum: [true],
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { favorite } = this.bodyParams;

			const room = await findRoomByIdOrName({ params: this.bodyParams });

			await toggleFavoriteMethod(this.userId, room._id, favorite);

			return API.v1.success();
		},
	)
	.post(
		'rooms.leave',
		{
			authRequired: true,
			body: isRoomsLeaveProps,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const room = await findRoomByIdOrName({ params: this.bodyParams });

			const user = await Users.findOneById(this.userId);

			if (!user) {
				return API.v1.failure('error-invalid-user');
			}

			await leaveRoomMethod(user, room._id);

			return API.v1.success();
		},
	)
	.post(
		'rooms.banUser',
		{
			authRequired: true,
			body: isRoomsBanUserProps,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: { success: { type: 'boolean', enum: [true] } },
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const user = await getUserFromParams(this.bodyParams);

			if (!user.username) {
				return API.v1.failure('Invalid user');
			}

			await banUserFromRoomMethod(this.userId, { rid: this.bodyParams.roomId, username: user.username });

			return API.v1.success();
		},
	)
	.post(
		'rooms.unbanUser',
		{
			authRequired: true,
			body: isRoomsUnbanUserProps,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: { success: { type: 'boolean', enum: [true] } },
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const user = await getUserFromParams(this.bodyParams, true);

			if (!user.username) {
				return API.v1.failure('Invalid user');
			}

			await unbanUserFromRoom(this.userId, { rid: this.bodyParams.roomId, username: user.username });

			return API.v1.success();
		},
	)
	.get(
		'rooms.bannedUsers',
		{
			authRequired: true,
			query: isRoomsBannedUsersProps,
			response: {
				200: roomsBannedUsersResponseSchema,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { roomId } = this.queryParams;

			if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
				return API.v1.unauthorized();
			}

			const { offset, count } = await getPaginationItems(this.queryParams);

			const { cursor, totalCount } = Subscriptions.findPaginated({ rid: roomId, status: 'BANNED' as const }, { offset, count });

			const [bannedSubs, total] = await Promise.all([cursor.toArray(), totalCount]);

			const userIds = bannedSubs.map((sub) => sub.u._id);
			const users = await Users.find<RequiredField<Pick<IUser, '_id' | 'username' | 'name'>, '_id' | 'username'>>(
				{ _id: { $in: userIds } },
				{ projection: { username: 1, name: 1 } },
			).toArray();

			return API.v1.success({
				bannedUsers: users,
				count: users.length,
				offset,
				total,
			});
		},
	);
type RoomEndpoints = ExtractRoutesFromAPI<typeof roomEndpoints> &
	ExtractRoutesFromAPI<typeof roomDeleteEndpoint> &
	ExtractRoutesFromAPI<typeof roomsSaveNotificationEndpoint>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends RoomEndpoints {}
}
