import { Meteor } from 'meteor/meteor';
import type { Notifications } from '@rocket.chat/rest-typings';
import { isGETRoomsNameExists } from '@rocket.chat/rest-typings';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import type { IRoom } from '@rocket.chat/core-typings';
import { Media } from '@rocket.chat/core-services';

import { API } from '../api';
import { canAccessRoomAsync, canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { getUploadFormData } from '../lib/getUploadFormData';
import { settings } from '../../../settings/server';
import { eraseRoom } from '../../../../server/methods/eraseRoom';
import { FileUpload } from '../../../file-upload/server';
import {
	findAdminRoom,
	findAdminRooms,
	findAdminRoomsAutocomplete,
	findChannelAndPrivateAutocomplete,
	findChannelAndPrivateAutocompleteWithPagination,
	findRoomsAvailableForTeams,
} from '../lib/rooms';
import * as dataExport from '../../../../server/lib/dataExport';
import { composeRoomWithLastMessage } from '../helpers/composeRoomWithLastMessage';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { leaveRoomMethod } from '../../../lib/server/methods/leaveRoom';
import { saveRoomSettings } from '../../../channel-settings/server/methods/saveRoomSettings';
import { createDiscussion } from '../../../discussion/server/methods/createDiscussion';
import { isTruthy } from '../../../../lib/isTruthy';
import { sendFileMessage } from '../../../file-upload/server/methods/sendFileMessage';

async function findRoomByIdOrName({
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

			return API.v1.success({ exists: await Meteor.callAsync('roomNameExists', roomName) });
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

API.v1.addRoute('rooms.get', {
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

		let result: { update: IRoom[]; remove: IRoom[] } = await Meteor.callAsync('rooms/get', updatedSinceDate);

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
});

API.v1.addRoute(
	'rooms.upload/:rid',
	{ authRequired: true },
	{
		async post() {
			if (!(await canAccessRoomIdAsync(this.urlParams.rid, this.userId))) {
				return API.v1.unauthorized();
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

			uploadedFile.description = fields.description;

			delete fields.description;

			await sendFileMessage(this.userId, { roomId: this.urlParams.rid, file: uploadedFile, msgData: fields });

			const message = await Messages.getMessageByFileIdAndUsername(uploadedFile._id, this.userId);

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
					Meteor.callAsync('saveNotificationSettings', roomId, notificationKey, notifications[notificationKey as keyof Notifications]),
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

			await Meteor.callAsync('toggleFavorite', room._id, favorite);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.cleanHistory',
	{ authRequired: true },
	{
		async post() {
			const { _id } = await findRoomByIdOrName({ params: this.bodyParams });

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

			const count = await Meteor.callAsync('cleanRoomHistory', {
				roomId: _id,
				latest: new Date(latest),
				oldest: new Date(oldest),
				inclusive,
				limit,
				excludePinned: [true, 'true', 1, '1'].includes(excludePinned ?? false),
				filesOnly: [true, 'true', 1, '1'].includes(filesOnly ?? false),
				ignoreThreads: [true, 'true', 1, '1'].includes(ignoreThreads ?? false),
				ignoreDiscussion: [true, 'true', 1, '1'].includes(ignoreDiscussion ?? false),
				fromUsers: users,
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

			return API.v1.success({ room: (await Rooms.findOneByIdOrName(room._id, { projection: fields })) ?? undefined });
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

API.v1.addRoute(
	'rooms.createDiscussion',
	{ authRequired: true },
	{
		async post() {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			const { prid, pmid, reply, t_name, users, encrypted } = this.bodyParams;
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

			const discussion = await createDiscussion(this.userId, {
				prid,
				pmid,
				t_name,
				reply,
				users: users?.filter(isTruthy) || [],
				encrypted,
			});

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
	{ authRequired: true },
	{
		async post() {
			const { rid, action } = this.bodyParams;

			let result;
			if (action === 'archive') {
				result = await Meteor.callAsync('archiveRoom', rid);
			} else {
				result = await Meteor.callAsync('unarchiveRoom', rid);
			}

			return API.v1.success({ result });
		},
	},
);

API.v1.addRoute(
	'rooms.export',
	{ authRequired: true },
	{
		async post() {
			const { rid, type } = this.bodyParams;

			if (!rid || !type || !['email', 'file'].includes(type)) {
				throw new Meteor.Error('error-invalid-params');
			}

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

				if (!['html', 'json'].includes(format || '')) {
					throw new Meteor.Error('error-invalid-format');
				}

				const convertedDateFrom = new Date(dateFrom || '');
				const convertedDateTo = new Date(dateTo || '');
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

				if (messages?.length === 0) {
					throw new Meteor.Error('error-invalid-messages');
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
