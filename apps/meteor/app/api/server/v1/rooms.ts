import { Media, Team } from '@rocket.chat/core-services';
import type { IRoom, IUpload } from '@rocket.chat/core-typings';
import { isPrivateRoom, isPublicRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms, Users, Uploads, Subscriptions } from '@rocket.chat/models';
import type { Notifications } from '@rocket.chat/rest-typings';
import {
	isGETRoomsNameExists,
	isRoomsImagesProps,
	isRoomsMuteUnmuteUserProps,
	isRoomsExportProps,
	isRoomsIsMemberProps,
	isRoomsCleanHistoryProps,
	isRoomsOpenProps,
	isRoomsMembersOrderedByRoleProps,
	isRoomsChangeArchivationStateProps,
	isRoomsHideProps,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { isTruthy } from '../../../../lib/isTruthy';
import { omit } from '../../../../lib/utils/omit';
import * as dataExport from '../../../../server/lib/dataExport';
import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { findUsersOfRoomOrderedByRole } from '../../../../server/lib/findUsersOfRoomOrderedByRole';
import { openRoom } from '../../../../server/lib/openRoom';
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
import { leaveRoomMethod } from '../../../lib/server/methods/leaveRoom';
import { executeUnarchiveRoom } from '../../../lib/server/methods/unarchiveRoom';
import { applyAirGappedRestrictionsValidation } from '../../../license/server/airGappedRestrictionsWrapper';
import type { NotificationFieldType } from '../../../push-notifications/server/methods/saveNotificationSettings';
import { saveNotificationSettingsMethod } from '../../../push-notifications/server/methods/saveNotificationSettings';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { getUserFromParams } from '../helpers/getUserFromParams';
import { getUploadFormData } from '../lib/getUploadFormData';
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

API.v1.addRoute(
	'rooms.nameExists',
	{
		authRequired: true,
		validateParams: isGETRoomsNameExists,
	},
	{
		async get() {
			const { roomName } = this.queryParams;

			const room = await Rooms.findOneByName(roomName, { projection: { _id: 1 } });

			return API.v1.success({ exists: !!room });
		},
	},
);

API.v1.addRoute(
	'rooms.delete',
	{
		authRequired: true,
	},
	{
		async post() {
			const { roomId } = this.bodyParams;

			if (!roomId) {
				return API.v1.failure("The 'roomId' param is required");
			}

			await eraseRoom(roomId, this.userId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.get',
	{ authRequired: true },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'rooms.upload/:rid',
	{
		authRequired: true,
		deprecation: {
			version: '8.0.0',
			alternatives: ['rooms.media'],
		},
	},
	{
		async post() {
			if (!(await canAccessRoomIdAsync(this.urlParams.rid, this.userId))) {
				return API.v1.forbidden();
			}

			const file = await getUploadFormData(
				{
					request: this.request,
				},
				{ field: 'file', sizeLimit: settings.get<number>('FileUpload_MaxFileSize') },
			);

			if (!file) {
				throw new Meteor.Error('invalid-field');
			}

			const { fields } = file;
			let { fileBuffer } = file;

			const details = {
				name: file.filename,
				size: fileBuffer.length,
				type: file.mimetype,
				rid: this.urlParams.rid,
				userId: this.userId,
			};

			const stripExif = settings.get('Message_Attachments_Strip_Exif');
			if (stripExif) {
				// No need to check mime. Library will ignore any files without exif/xmp tags (like BMP, ico, PDF, etc)
				fileBuffer = await Media.stripExifFromBuffer(fileBuffer);
			}

			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = await fileStore.insert(details, fileBuffer);

			if ((fields.description?.length ?? 0) > settings.get<number>('Message_MaxAllowedSize')) {
				throw new Meteor.Error('error-message-size-exceeded');
			}

			uploadedFile.description = fields.description;

			delete fields.description;

			await applyAirGappedRestrictionsValidation(() =>
				sendFileMessage(this.userId, { roomId: this.urlParams.rid, file: uploadedFile, msgData: fields }),
			);

			const message = await Messages.getMessageByFileIdAndUsername(uploadedFile._id, this.userId);

			return API.v1.success({
				message,
			});
		},
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

			const file = await getUploadFormData(
				{
					request: this.request,
				},
				{ field: 'file', sizeLimit: settings.get<number>('FileUpload_MaxFileSize') },
			);

			if (!file) {
				throw new Meteor.Error('invalid-field');
			}

			let { fileBuffer } = file;

			const expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours() + 24);

			const { fields } = file;

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
				size: fileBuffer.length,
				type: file.mimetype,
				rid: this.urlParams.rid,
				userId: this.userId,
				content,
				expiresAt,
			};

			const stripExif = settings.get('Message_Attachments_Strip_Exif');
			if (stripExif) {
				// No need to check mime. Library will ignore any files without exif/xmp tags (like BMP, ico, PDF, etc)
				fileBuffer = await Media.stripExifFromBuffer(fileBuffer);
			}

			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = await fileStore.insert(details, fileBuffer);

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

			const file = await Uploads.findOneById(this.urlParams.fileId);

			if (!file) {
				throw new Meteor.Error('invalid-file');
			}

			if ((this.bodyParams.description?.length ?? 0) > settings.get<number>('Message_MaxAllowedSize')) {
				throw new Meteor.Error('error-message-size-exceeded');
			}

			file.description = this.bodyParams.description;
			delete this.bodyParams.description;

			await applyAirGappedRestrictionsValidation(() =>
				sendFileMessage(this.userId, { roomId: this.urlParams.rid, file, msgData: this.bodyParams }, { parseAttachmentsForE2EE: false }),
			);

			await Uploads.confirmTemporaryFile(this.urlParams.fileId, this.userId);

			const message = await Messages.getMessageByFileIdAndUsername(file._id, this.userId);

			return API.v1.success({
				message,
			});
		},
	},
);

API.v1.addRoute(
	'rooms.saveNotification',
	{ authRequired: true },
	{
		async post() {
			const { roomId, notifications } = this.bodyParams;

			if (!roomId) {
				return API.v1.failure("The 'roomId' param is required");
			}

			if (!notifications || Object.keys(notifications).length === 0) {
				return API.v1.failure("The 'notifications' param is required");
			}

			await Promise.all(
				Object.keys(notifications as Notifications).map(async (notificationKey) =>
					saveNotificationSettingsMethod(
						this.userId,
						roomId,
						notificationKey as NotificationFieldType,
						notifications[notificationKey as keyof Notifications],
					),
				),
			);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.favorite',
	{ authRequired: true },
	{
		async post() {
			const { favorite } = this.bodyParams;

			if (!this.bodyParams.hasOwnProperty('favorite')) {
				return API.v1.failure("The 'favorite' param is required");
			}

			const room = await findRoomByIdOrName({ params: this.bodyParams });

			await toggleFavoriteMethod(this.userId, room._id, favorite);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.cleanHistory',
	{ authRequired: true, validateParams: isRoomsCleanHistoryProps },
	{
		async post() {
			const room = await findRoomByIdOrName({ params: this.bodyParams });
			const { _id } = room;

			if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
				return API.v1.failure('User does not have access to the room [error-not-allowed]', 'error-not-allowed');
			}

			const {
				latest,
				oldest,
				inclusive = false,
				limit,
				excludePinned,
				filesOnly,
				ignoreThreads,
				ignoreDiscussion,
				users,
			} = this.bodyParams;

			if (!latest) {
				return API.v1.failure('Body parameter "latest" is required.');
			}

			if (!oldest) {
				return API.v1.failure('Body parameter "oldest" is required.');
			}

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
	},
);

API.v1.addRoute(
	'rooms.info',
	{ authRequired: true },
	{
		async get() {
			const room = await findRoomByIdOrName({ params: this.queryParams });
			const { fields } = await this.parseJsonQuery();

			if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
				return API.v1.failure('not-allowed', 'Not Allowed');
			}

			const discussionParent =
				room.prid &&
				(await Rooms.findOneById<Pick<IRoom, 'name' | 'fname' | 't' | 'prid' | 'u'>>(room.prid, {
					projection: { name: 1, fname: 1, t: 1, prid: 1, u: 1, sidepanel: 1 },
				}));
			const { team, parentRoom } = await Team.getRoomInfo(room);
			const parent = discussionParent || parentRoom;

			return API.v1.success({
				room: await Rooms.findOneByIdOrName(room._id, { projection: fields }),
				...(team && { team }),
				...(parent && { parent }),
			});
		},
	},
);

API.v1.addRoute(
	'rooms.leave',
	{ authRequired: true },
	{
		async post() {
			const room = await findRoomByIdOrName({ params: this.bodyParams });
			const user = await Users.findOneById(this.userId);
			if (!user) {
				return API.v1.failure('Invalid user');
			}
			await leaveRoomMethod(user, room._id);

			return API.v1.success();
		},
	},
);

/*
TO-DO: 8.0.0 should use the ajv validation
which will change this endpoint's
response errors.
*/
API.v1.addRoute(
	'rooms.createDiscussion',
	{ authRequired: true /* , validateParams: isRoomsCreateDiscussionProps */ },
	{
		async post() {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { prid, pmid, reply, t_name, users, encrypted, topic } = this.bodyParams;
			if (!prid) {
				return API.v1.failure('Body parameter "prid" is required.');
			}
			if (!t_name) {
				return API.v1.failure('Body parameter "t_name" is required.');
			}
			if (users && !Array.isArray(users)) {
				return API.v1.failure('Body parameter "users" must be an array.');
			}

			if (encrypted !== undefined && typeof encrypted !== 'boolean') {
				return API.v1.failure('Body parameter "encrypted" must be a boolean when included.');
			}

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
	},
);

API.v1.addRoute(
	'rooms.getDiscussions',
	{ authRequired: true },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'rooms.images',
	{ authRequired: true, validateParams: isRoomsImagesProps },
	{
		async get() {
			const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'teamId' | 'prid'>>(this.queryParams.roomId, {
				projection: { t: 1, teamId: 1, prid: 1 },
			});

			if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
				return API.v1.forbidden();
			}

			let initialImage: IUpload | null = null;
			if (this.queryParams.startingFromId) {
				initialImage = await Uploads.findOneById(this.queryParams.startingFromId);
			}

			const { offset, count } = await getPaginationItems(this.queryParams);

			const { cursor, totalCount } = Uploads.findImagesByRoomId(room._id, initialImage?.uploadedAt, {
				skip: offset,
				limit: count,
			});

			const [files, total] = await Promise.all([cursor.toArray(), totalCount]);

			// If the initial image was not returned in the query, insert it as the first element of the list
			if (initialImage && !files.find(({ _id }) => _id === (initialImage as IUpload)._id)) {
				files.splice(0, 0, initialImage);
			}

			return API.v1.success({
				files,
				count,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'rooms.adminRooms',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { types, filter } = this.queryParams;

			return API.v1.success(
				await findAdminRooms({
					uid: this.userId,
					filter: filter || '',
					types: (types && !Array.isArray(types) ? [types] : types) ?? [],
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.autocomplete.adminRooms',
	{ authRequired: true },
	{
		async get() {
			const { selector } = this.queryParams;
			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

			return API.v1.success(
				await findAdminRoomsAutocomplete({
					uid: this.userId,
					selector: JSON.parse(selector),
				}),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.adminRooms.getRoom',
	{ authRequired: true },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'rooms.autocomplete.channelAndPrivate',
	{ authRequired: true },
	{
		async get() {
			const { selector } = this.queryParams;
			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

			return API.v1.success(
				await findChannelAndPrivateAutocomplete({
					uid: this.userId,
					selector: JSON.parse(selector),
				}),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.autocomplete.channelAndPrivate.withPagination',
	{ authRequired: true },
	{
		async get() {
			const { selector } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			if (!selector) {
				return API.v1.failure("The 'selector' param is required");
			}

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
	},
);

API.v1.addRoute(
	'rooms.autocomplete.availableForTeams',
	{ authRequired: true },
	{
		async get() {
			const { name } = this.queryParams;

			if (name && typeof name !== 'string') {
				return API.v1.failure("The 'name' param is invalid");
			}

			return API.v1.success(
				await findRoomsAvailableForTeams({
					uid: this.userId,
					name: name || '',
				}),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.saveRoomSettings',
	{ authRequired: true },
	{
		async post() {
			const { rid, ...params } = this.bodyParams;

			const result = await saveRoomSettings(this.userId, rid, params);

			return API.v1.success({ rid: result.rid });
		},
	},
);

API.v1.addRoute(
	'rooms.changeArchivationState',
	{ authRequired: true, validateParams: isRoomsChangeArchivationStateProps },
	{
		async post() {
			const { rid, action } = this.bodyParams;

			let result;
			if (action === 'archive') {
				result = await executeArchiveRoom(this.userId, rid);
			} else {
				result = await executeUnarchiveRoom(this.userId, rid);
			}

			return API.v1.success({ result });
		},
	},
);

API.v1.addRoute(
	'rooms.export',
	{ authRequired: true, validateParams: isRoomsExportProps },
	{
		async post() {
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
						format: format as 'html' | 'json',
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
	},
);

API.v1.addRoute(
	'rooms.isMember',
	{
		authRequired: true,
		validateParams: isRoomsIsMemberProps,
	},
	{
		async get() {
			const { roomId, userId, username } = this.queryParams;
			const [room, user] = await Promise.all([
				findRoomByIdOrName({
					params: { roomId },
				}) as Promise<IRoom>,
				Users.findOneByIdOrUsername(userId || username),
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
	},
);

API.v1.addRoute(
	'rooms.membersOrderedByRole',
	{ authRequired: true, validateParams: isRoomsMembersOrderedByRoleProps },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'rooms.muteUser',
	{ authRequired: true, validateParams: isRoomsMuteUnmuteUserProps },
	{
		async post() {
			const user = await getUserFromParams(this.bodyParams);

			if (!user.username) {
				return API.v1.failure('Invalid user');
			}

			await muteUserInRoom(this.userId, { rid: this.bodyParams.roomId, username: user.username });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.unmuteUser',
	{ authRequired: true, validateParams: isRoomsMuteUnmuteUserProps },
	{
		async post() {
			const user = await getUserFromParams(this.bodyParams);

			if (!user.username) {
				return API.v1.failure('Invalid user');
			}

			await unmuteUserInRoom(this.userId, { rid: this.bodyParams.roomId, username: user.username });

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.open',
	{ authRequired: true, validateParams: isRoomsOpenProps },
	{
		async post() {
			const { roomId } = this.bodyParams;

			await openRoom(this.userId, roomId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.hide',
	{ authRequired: true, validateParams: isRoomsHideProps },
	{
		async post() {
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
	},
);
