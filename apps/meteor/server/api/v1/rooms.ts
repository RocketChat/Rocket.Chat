import { FederationMatrix, MeteorError, Room, Team } from '@rocket.chat/core-services';
import {
	type IRoom,
	type IRoomAbacRedaction,
	type IMessage,
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
	isRoomsJoinProps,
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

import { roomsExamples } from './rooms.examples';
import { adminFields } from '../../../lib/rooms/adminFields';
import { omit } from '../../../lib/utils/omit';
import { canAccessRoomAsync, canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { stripABACManagedFieldsForAdmin } from '../../lib/authorization/isABACManagedRoom';
import { banUserFromRoomMethod } from '../../lib/banUserFromRoom';
import { applyAirGappedRestrictionsValidation } from '../../lib/cloud/license/airGappedRestrictionsWrapper';
import * as dataExport from '../../lib/dataExport';
import { eraseRoom } from '../../lib/eraseRoom';
import { findUsersOfRoomOrderedByRole } from '../../lib/findUsersOfRoomOrderedByRole';
import { FileUpload } from '../../lib/media/file-upload';
import { notifyOnSubscriptionChanged } from '../../lib/notifyListener';
import { openRoom } from '../../lib/openRoom';
import type { RoomRoles } from '../../lib/roles/getRoomRoles';
import { syncRolePrioritiesForRoomIfRequired } from '../../lib/rooms/syncRolePrioritiesForRoomIfRequired';
import { unbanUserFromRoom } from '../../lib/unbanUserFromRoom';
import { createDiscussion } from '../../meteor-methods/messages/createDiscussion';
import { sendFileMessage } from '../../meteor-methods/messages/sendFileMessage';
import { executeArchiveRoom } from '../../meteor-methods/rooms/archiveRoom';
import { cleanRoomHistoryMethod } from '../../meteor-methods/rooms/cleanRoomHistory';
import { executeGetRoomRoles } from '../../meteor-methods/rooms/getRoomRoles';
import { hideRoomMethod } from '../../meteor-methods/rooms/hideRoom';
import { leaveRoomMethod } from '../../meteor-methods/rooms/leaveRoom';
import { muteUserInRoom } from '../../meteor-methods/rooms/muteUserInRoom';
import { saveRoomSettings } from '../../meteor-methods/rooms/saveRoomSettings';
import { toggleFavoriteMethod } from '../../meteor-methods/rooms/toggleFavorite';
import { executeUnarchiveRoom } from '../../meteor-methods/rooms/unarchiveRoom';
import { unmuteUserInRoom } from '../../meteor-methods/rooms/unmuteUserInRoom';
import { saveNotificationSettingsMethod } from '../../meteor-methods/users/saveNotificationSettings';
import type { NotificationFieldType } from '../../meteor-methods/users/saveNotificationSettings';
import { roomsGetMethod } from '../../publications/room';
import { settings } from '../../settings';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { MultipartUploadHandler } from '../lib/MultipartUploadHandler';
import { composeRoomWithLastMessage } from '../lib/composeRoomWithLastMessage';
import { getPaginationItems } from '../lib/getPaginationItems';
import { getUserFromParams } from '../lib/getUserFromParams';
import {
	findAdminRoom,
	findAdminRooms,
	findAdminRoomsAutocomplete,
	findChannelAndPrivateAutocomplete,
	findChannelAndPrivateAutocompleteWithPagination,
	findRoomsAvailableForTeams,
} from '../lib/rooms';
import { scopeAdminRoomsForAbac } from '../lib/scopeAdminRoomsForAbac';

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
		summary: 'Check if Room Name Exists',
		description: `Check if the room name exists`,
		examples: roomsExamples['rooms.nameExists'],
		tags: ['Rooms'],
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
		summary: 'Delete Room',
		description: `Delete a room from the workspace. The following permissions are required:
* \`delete-c\`: To delete a public room.
* \`delete-d\`: To delete direct messages.
* \`delete-p\`: To delete private rooms.
* \`delete-team\`: To delete a team.
* \`delete-team-channel\`: To delete a channel within a team, also requires the \`delete-c\` permission.
* \`delete-team-group\`: To delete a private channel within a team, also requires the \`delete-p\` permission.

> You can't use this endpoint to delete a team's main room. Use [Delete a Team endpoint](https://developer.rocket.chat/apidocs/delete-a-team) instead.

### Changelog
| Version | Description   |
| ------- | --------------|
| 5.4.0   | Added         |`,
		examples: roomsExamples['rooms.delete'],
		tags: ['Rooms'],
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
		summary: 'Get Rooms',
		description: `Get all opened rooms (all joined public & private channels and all DMs) of the authenticated user.

### Changelog
| Version | Description   |
| ------- | --------------|
| 0.72.0  | Added         |`,
		examples: roomsExamples['rooms.get'],
		tags: ['Rooms'],
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
		summary: 'Set Room Notifications',
		description: `Set the <a href='https://docs.rocket.chat/docs/room-actions#manage-room-notifications' target='_blank'>notification settings</a> of a specific room.

### Changelog
| Version | Description |
| ------- | ----------- |
|0.63.0  | Added        |`,
		examples: roomsExamples['rooms.saveNotification'],
		tags: ['Rooms'],
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

const saveDraftBodySchema = ajv.compile<{ rid: IRoom['_id']; draft: string; tmid?: IMessage['_id'] }>({
	type: 'object',
	properties: {
		rid: { type: 'string', minLength: 1 },
		draft: { type: 'string' },
		tmid: { type: 'string', minLength: 1, pattern: '^[^.$]+$' },
	},
	required: ['rid', 'draft'],
	additionalProperties: false,
});

const saveDraftResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const roomsSaveDraftEndpoint = API.v1.post(
	'rooms.saveDraft',
	{
		authRequired: true,
		body: saveDraftBodySchema,
		response: {
			200: saveDraftResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { rid, draft, tmid } = this.bodyParams;

		if (draft.length > (settings.get<number>('Message_MaxAllowedSize') ?? 0)) {
			return API.v1.failure('error-message-size-exceeded');
		}

		const subscription = await Subscriptions.updateDraftByRoomIdAndUserId(rid, this.userId, draft || undefined, tmid);
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription');
		}

		void notifyOnSubscriptionChanged(subscription);

		return API.v1.success();
	},
);

API.v1.post(
	'rooms.cleanHistory',
	{
		summary: 'Clear Room History',
		description: `Cleans up a room by removing messages from the provided time range. For details, see the <a href='https://docs.rocket.chat/docs/room-actions#prune-messages-from-a-room' target='_blank'>Prune messages from a room</a> section.

Permission required: \`clean-channel-history\`

### Changelog
| Version | Description            |
| ------- | ---------------------- |
| 0.64.0  | Added                  |
| 0.67.0  | Added fields \`limit\`, \`excludePinned\`, \`filesOnly\` and \`users\` |`,
		examples: roomsExamples['rooms.cleanHistory'],
		tags: ['Rooms'],
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
		summary: 'Get Room Information',
		description: `Retrieves the information about the room.

### Changelog
| Version | Description |
| ------- | ----------- |
|0.72.0   | Added       |`,
		examples: roomsExamples['rooms.info'],
		tags: ['Rooms'],
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
		const room = await findRoomByIdOrName({ params: this.queryParams, checkedArchived: false });
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
		summary: 'Create Discussion',
		description: `Creates a new discussion for the room. It requires at least one of the following permissions: \`start-discussion\` OR \`start-discussion-other-user\`, AND must be with the following setting enabled: \`Discussion_enabled\`.

### Changelog
| Version | Description |
| ------- | ----------- |
| 1.0.0   | Added       |`,
		examples: roomsExamples['rooms.createDiscussion'],
		tags: ['Rooms'],
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
		summary: 'Get Room Discussions',
		description: `Get all <a href='https://docs.rocket.chat/docs/discussions' target='_blank'>discussions</a> of a room. 

### Changelog
| Version | Description   |
| ------- | --------------|
| 1.0.0   | Added         |`,
		examples: roomsExamples['rooms.getDiscussions'],
		tags: ['Rooms'],
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
		summary: 'Get Room Images',
		description: `Retrieves the images of a room that you are a member of.`,
		examples: roomsExamples['rooms.images'],
		tags: ['Rooms'],
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
		summary: 'Get All Room Admins',
		description: `Retrieves all rooms and admin information.

Permission required: \`view-room-administration\`

### Changelog
| Version | Description  |
| ------- |--------------|
| 8.7.0  | Restored \`customFields\` in the response |
| 2.4.0  | Added         |`,
		examples: roomsExamples['rooms.adminRooms'],
		tags: ['Rooms'],
		authRequired: true,
		query: isRoomsAdminRoomsProps,
		response: {
			200: ajv.compile<{
				rooms: Array<Pick<IRoom, RoomAdminFieldsType> & IRoomAbacRedaction>;
				count: number;
				offset: number;
				total: number;
			}>({
				type: 'object',
				properties: {
					rooms: { type: 'array', items: { type: 'object' } }, // relaxed: IRoom with admin fields + optional ABAC redaction
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
		summary: 'Admin Autocomplete Room Name for Private and Public Rooms',
		description: `List public and private rooms whose names match a given string, excluding <a href="https://docs.rocket.chat/docs/direct-messages" target="_blank">DMs</a>, and <a href="https://docs.rocket.chat/docs/omnichannel" target="_blank">omnichannel rooms</a>. This endpoint is valuable when performing search operations. Only workspace administrators can use it. Any one of the following permissions are required:
* \`view-room-administration\`
* \`can-audit\``,
		examples: roomsExamples['rooms.autocomplete.adminRooms'],
		tags: ['Rooms'],
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
		summary: 'Get Admin of Room',
		description: `Retrieves the admin of a room.

Permission required: \`view-room-administration\`

### Changelog
| Version | Description     |
| ------- | --------------- |
| 8.7.0   | Restored \`customFields\` in the response |
| 2.4.0   | Added           |`,
		examples: roomsExamples['rooms.adminRooms.getRoom'],
		tags: ['Rooms'],
		authRequired: true,
		query: isRoomsAdminRoomsGetRoomProps,
		response: {
			200: ajv.compile<Pick<IRoom, RoomAdminFieldsType> & IRoomAbacRedaction>({
				allOf: [
					{ $ref: '#/components/schemas/IRoomAdmin' },
					{
						type: 'object',
						properties: {
							success: { type: 'boolean', enum: [true] },
							abacAttributesRedacted: { type: 'boolean' },
						},
						required: ['success'],
					},
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
		summary: 'Autocomplete Room Name for Private and Public Rooms',
		description: `List the public and private rooms whose names match a given string, excluding <a href="https://docs.rocket.chat/docs/discussions" target="_blank">discussions</a>, <a href="https://docs.rocket.chat/docs/direct-messages" target="_blank">DMs</a>, and <a href="https://docs.rocket.chat/docs/omnichannel" target="_blank">omnichannel rooms</a>. The endpoint is valuable when performing search operations. It returns only rooms that the user belongs to.`,
		examples: roomsExamples['rooms.autocomplete.channelAndPrivate'],
		tags: ['Rooms'],
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
		summary: 'Autocomplete Room Name With Pagination',
		description: `List the public and private rooms whose names match a given string, excluding discussions, DMs, and omnichannel rooms. The endpoint is valuable when performing search operations. It returns only rooms that the user belongs to. This endpoint includes pagination query parameters.`,
		examples: roomsExamples['rooms.autocomplete.channelAndPrivate.withPagination'],
		tags: ['Rooms'],
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
		summary: 'Autocomplete Room Name for Team',
		description: `Autocompletes room name available for conversion to team.`,
		examples: roomsExamples['rooms.autocomplete.availableForTeams'],
		tags: ['Rooms'],
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
		summary: 'Save Room Settings',
		description: `Updates the settings of an existing room.

For ABAC-managed rooms, the following guardrails apply:

- Changing \`roomAnnouncement\`, \`roomTopic\`, or \`roomDescription\` is rejected with \`error-action-not-allowed\`.
- Setting \`default: true\` on an ABAC-managed room is rejected with \`error-action-not-allowed\`.
- Changing \`roomType\` from \`p\` to \`c\` is rejected with \`error-action-not-allowed\`. The same guard applies to private rooms in ABAC-managed private teams.
- When \`roomType\` changes to \`c\` (public) and conversion is allowed, existing room ABAC attributes are cleared as part of the conversion.

Permission required: \`edit-room\`

### Changelog
| Version | Description |
| ------- | ------------|
| 8.5.0   | Added ABAC guardrails: announcement, topic, description, default flag, and conversion to public are blocked on ABAC-managed rooms. |
| 3.13.0  | Added       |`,
		examples: roomsExamples['rooms.saveRoomSettings'],
		tags: ['Rooms'],
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
		summary: 'Change Room Archive State',
		description: `Archive or unarchive a room. Permissions required:
* \`archive-room\`: To archive a room.
* \`unarchive-room\`: To unarchive a room.

### Changelog
| Version | Description      |
| ------- | ---------------- |
| 3.3.0  | Added             |`,
		examples: roomsExamples['rooms.changeArchivationState'],
		tags: ['Rooms'],
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
		summary: 'Export Room',
		description: `Export room messages to a file or email. When exporting to a file, the ZIP file is stored in the \`/tmp\` directory on the Rocket.Chat server, and its details are recorded in the \`rocketchat_user_data_files\` collection in MongoDB.

Permission required: \`mail-messages\`

### Changelog

| Version | Description                          |
| ------- | ------------------------------------ |
| 3.8.0   | Added                                |`,
		examples: roomsExamples['rooms.export'],
		tags: ['Rooms'],
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

		if (!(await hasPermissionAsync(this.user, 'mail-messages', rid))) {
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
		summary: 'Check Room Member',
		description: `Use this endpoint to check whether or not a user is a member of a specific room. If the user is not a member of the room, an error response (\`error-user-not-found\`) is returned. You can only get the results for the rooms that you are a member of. Otherwise, you get a forbidden error response.`,
		examples: roomsExamples['rooms.isMember'],
		tags: ['Rooms'],
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
		summary: 'Get Room Members Ordered by Role',
		description: `Get room members ordered by their roles. This endpoint sorts the members according to their role in the room in the order \`Owners\` > \`Moderators\` > all other members. This can be reversed using the query paramter \`sort={"rolePriority":-1}\`. You need not be a member of the room.

If the room is a broadcast room, you need the \`view-broadcast-member-list\` permission to view the room members.

### Changelog
| Version | Description |
| ------- | ----------- |
| 7.3.0   | Added       |`,
		examples: roomsExamples['rooms.membersOrderedByRole'],
		tags: ['Rooms'],
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

		if (findResult.broadcast && !(await hasPermissionAsync(this.user, 'view-broadcast-member-list', findResult._id))) {
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
		summary: 'Mute User in Room',
		description: `Mute a particular user in a room. Permission required: \`mute-user\`. The room becomes read-only for the muted user. They can still view messages but cannot send any until unmuted.

### Changelog

| Version | Description                          |
| ------- | ------------------------------------ |
| 6.8.0   | Added                                |`,
		examples: roomsExamples['rooms.muteUser'],
		tags: ['Rooms'],
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
		summary: 'Unmute User in Room',
		description: `Unmute a particular user in a room. Permission required: \`mute-user\`

### Changelog

| Version | Description                          |
| ------- | ------------------------------------ |
| 6.8.0   | Added                                |`,
		examples: roomsExamples['rooms.unmuteUser'],
		tags: ['Rooms'],
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
	'rooms.join',
	{
		summary: 'Join a Room',
		description: `Join a room of any type, including public channels, private groups, and discussions. Unlike the <a href='https://developer.rocket.chat/apidocs/join-a-channel' target='_blank'>channels.join</a> endpoint, which only joins public channels, this endpoint applies to all kinds of rooms. 

### Changelog
| Version      | Description |
| ------------ | ----------- |
| 8.6.0   | Added       |`,
		examples: roomsExamples['rooms.join'],
		tags: ['Rooms'],
		authRequired: true,
		body: isRoomsJoinProps,
		response: {
			200: ajv.compile<{ room: IRoom }>({
				type: 'object',
				properties: {
					room: { type: 'object' },
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
		const { joinCode, ...params } = this.bodyParams;
		const room = await findRoomByIdOrName({ params });

		await Room.join({ room, user: this.user, joinCode });

		return API.v1.success({
			room: await findRoomByIdOrName({ params }),
		});
	},
);

API.v1.post(
	'rooms.hide',
	{
		summary: 'Hide Room',
		description: `Hide rooms without restrictions based on type. You can only hide a room if you have access to it.

### Changelog

| Version | Description                          |
| ------- | ------------------------------------ |
| 7.4.0   | Added                                |`,
		examples: roomsExamples['rooms.hide'],
		tags: ['Rooms'],
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

		const user = await Users.findOneById(this.userId, { projection: { _id: 1 } });

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
			summary: 'Get Room Roles',
			description: `Get the list of roles in a specific room. This endpoint returns users with the \`Owner\`, \`Leader\`, and \`Moderator\` room roles. You can refer to the <a href='https://docs.rocket.chat/docs/roles-in-rocketchat' target='_blank'>Roles user guide</a> for more details on roles in Rocket.Chat.

### Changelog
| Version | Description                          |
| ------- | ------------------------------------ |
| 7.10.0   | Added                               |`,
			examples: roomsExamples['rooms.roles'],
			tags: ['Rooms'],
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
					rooms: Array<Pick<IRoom, RoomAdminFieldsType> & IRoomAbacRedaction>;
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

			const [rooms, total] = await Promise.all([cursor.map(stripABACManagedFieldsForAdmin).toArray(), totalCount]);

			return API.v1.success({
				rooms: await scopeAdminRoomsForAbac(rooms, this.userId),
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
			summary: 'Favorite/Unfavourite a Room',
			description: `Mark/Unmark a room as favourite.

### Changelog
| Version | Description   |
| ------- | --------------|
| 0.64.0   | Added        |`,
			examples: roomsExamples['rooms.favorite'],
			tags: ['Rooms'],
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
			summary: 'Leave Room',
			description: `Leave a room. The following permissions are required:
* \`leave-c\`: To leave a public room.
* \`leave-p\`: To leave private room.

### Changelog
| Version | Description   |
| ------- | --------------|
| 0.72.0  | Added         |`,
			tags: ['Rooms'],
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

			const { cursor, totalCount } = Subscriptions.findPaginated(
				{ rid: roomId, status: 'BANNED' as const },
				{ sort: { ts: 1 }, skip: offset, limit: count, projection: { 'u._id': 1 } },
			);

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
	ExtractRoutesFromAPI<typeof roomsSaveNotificationEndpoint> &
	ExtractRoutesFromAPI<typeof roomsSaveDraftEndpoint>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends RoomEndpoints {}
}
