/* eslint-disable @typescript-eslint/camelcase */
import { Meteor } from 'meteor/meteor';
import { IRoom, IUser } from '@rocket.chat/core-typings';
import {
	isGETRoomsGet,
	isPOSTSaveNotification,
	isPOSTRoomsFavorite,
	isPOSTCleanHistory,
	isPOSTCreateDiscussion,
	isGETGetDiscussions,
	isGETAdminRooms,
	isGETAutocompleteAdminRooms,
	isGETAdminRoomsGetRoom,
	isGETAutocompleteChannelAndPrivate,
	isGETAutocompleteChannelAndPrivateWithPagination,
	isGETAutocompleteAvailableForTeams,
	isPOSTSaveRoomSettings,
	isPOSTChangeArchivationState,
	isPOSTRoomsExport,
} from '@rocket.chat/rest-typings';
import { Rooms as RoomsRaw } from '@rocket.chat/models';

import { FileUpload } from '../../../file-upload/server';
import { Rooms, Messages } from '../../../models/server';
import { API } from '../api';
import {
	findAdminRooms,
	findChannelAndPrivateAutocomplete,
	findAdminRoom,
	findAdminRoomsAutocomplete,
	findRoomsAvailableForTeams,
	findChannelAndPrivateAutocompleteWithPagination,
} from '../lib/rooms';
import { sendFile, sendViaEmail } from '../../../../server/lib/channelExport';
import { canAccessRoom, canAccessRoomId, hasPermission } from '../../../authorization/server';
import { Media } from '../../../../server/sdk';
import { settings } from '../../../settings/server/index';
import { getUploadFormData } from '../lib/getUploadFormData';

function findRoomByIdOrName({
	params,
	checkedArchived = true,
}: {
	params: {
		roomId: string;
		roomName?: string;
		[key: string]: unknown;
	};
	checkedArchived?: boolean;
}): IRoom {
	if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
		throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const fields = { ...API.v1.defaultFieldsToExclude };

	let room;
	if (params.roomId) {
		room = Rooms.findOneById(params.roomId, { fields });
	} else if (params.roomName) {
		room = Rooms.findOneByName(params.roomName, { fields });
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
	'rooms.get',
	{
		authRequired: true,
		validateParams: isGETRoomsGet,
	},
	{
		get() {
			const { updatedSince } = this.queryParams;
			const { userId } = this;

			let updatedSinceDate;

			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}

			let result;

			result = Meteor.call('rooms/get', updatedSinceDate);

			if (Array.isArray(result)) {
				result = {
					update: result,
					remove: [],
				};
			}

			return API.v1.success({
				update: result.update.map((room: IRoom) => this.composeRoomWithLastMessage(room, userId)),
				remove: result.remove.map((room: IRoom) => this.composeRoomWithLastMessage(room, userId)),
			});
		},
	},
);

API.v1.addRoute(
	'rooms.upload/:rid',
	{ authRequired: true },
	{
		post() {
			if (!canAccessRoomId(this.urlParams.rid, this.userId)) {
				return API.v1.unauthorized();
			}

			const [file, fields] = Promise.await(
				getUploadFormData(
					{
						request: this.request,
					},
					{ field: 'file' },
				),
			);

			if (!file) {
				throw new Meteor.Error('invalid-field');
			}

			const details = {
				name: file.filename,
				size: file.fileBuffer.length,
				type: file.mimetype,
				rid: this.urlParams.rid,
				userId: this.userId,
			};

			const stripExif = settings.get('Message_Attachments_Strip_Exif');
			const fileStore = FileUpload.getStore('Uploads');
			if (stripExif) {
				// No need to check mime. Library will ignore any files without exif/xmp tags (like BMP, ico, PDF, etc)
				file.fileBuffer = Promise.await(Media.stripExifFromBuffer(file.fileBuffer));
			}
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			delete fields.description;

			Meteor.call('sendFileMessage', this.urlParams.rid, null, uploadedFile, fields);

			return API.v1.success({
				message: Messages.getMessageByFileIdAndUsername(uploadedFile._id, this.userId),
			});
		},
	},
);

API.v1.addRoute(
	'rooms.saveNotification',
	{
		authRequired: true,
		validateParams: isPOSTSaveNotification,
	},
	{
		post() {
			const saveNotifications = (notifications: string, roomId: string): void => {
				Object.keys(notifications).forEach((notificationKey) =>
					Meteor.call('saveNotificationSettings', roomId, notificationKey, notifications[notificationKey]),
				);
			};
			const { roomId, notifications } = this.bodyParams;

			if (!notifications || Object.keys(notifications).length === 0) {
				return API.v1.failure("The 'notifications' param is required");
			}

			saveNotifications(notifications, roomId);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.favorite',
	{
		authRequired: true,
		validateParams: isPOSTRoomsFavorite,
	},
	{
		post() {
			const { favorite } = this.bodyParams;

			const room = findRoomByIdOrName({ params: this.bodyParams });

			Meteor.call('toggleFavorite', room._id, favorite);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.cleanHistory',
	{
		authRequired: true,
		validateParams: isPOSTCleanHistory,
	},
	{
		async post() {
			const { _id } = findRoomByIdOrName({ params: this.bodyParams });

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

			const count = await Meteor.call('cleanRoomHistory', {
				roomId: _id,
				latest: new Date(latest),
				oldest: new Date(oldest),
				inclusive,
				limit,
				excludePinned: [true, 'true', 1, '1'].includes(excludePinned),
				filesOnly: [true, 'true', 1, '1'].includes(filesOnly),
				ignoreThreads: [true, 'true', 1, '1'].includes(ignoreThreads),
				ignoreDiscussion: [true, 'true', 1, '1'].includes(ignoreDiscussion),
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
		get() {
			// type RoomsInfoProps = { roomId: string; roomName?: string } | { roomId?: string; roomName: string }
			const room = findRoomByIdOrName({ params: this.requestParams() });
			const { fields } = this.parseJsonQuery();

			if (!room || !canAccessRoom(room, { _id: this.userId })) {
				return API.v1.failure('not-allowed', 'Not Allowed');
			}

			return API.v1.success({ room: Rooms.findOneByIdOrName(room._id, { fields }) });
		},
	},
);

API.v1.addRoute(
	'rooms.leave',
	{ authRequired: true },
	{
		post() {
			const room = findRoomByIdOrName({ params: this.bodyParams });

			Meteor.call('leaveRoom', room._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'rooms.createDiscussion',
	{
		authRequired: true,
		validateParams: isPOSTCreateDiscussion,
	},
	{
		post() {
			const { prid, pmid, reply, t_name, users, encrypted } = this.bodyParams;

			if (encrypted !== undefined && typeof encrypted !== 'boolean') {
				return API.v1.failure('Body parameter "encrypted" must be a boolean when included.');
			}

			const discussion = Meteor.call('createDiscussion', {
				prid,
				pmid,
				t_name,
				reply,
				users: users || [],
				encrypted,
			});

			return API.v1.success({ discussion });
		},
	},
);

API.v1.addRoute(
	'rooms.getDiscussions',
	{
		authRequired: true,
		validateParams: isGETGetDiscussions,
	},
	{
		async get() {
			const room = findRoomByIdOrName({ params: this.requestParams() });
			const { offset, count } = this.getPaginationItems();
			const { sort, fields, query } = this.parseJsonQuery();

			if (!room || !canAccessRoom(room, { _id: this.userId })) {
				return API.v1.failure('not-allowed', 'Not Allowed');
			}

			const ourQuery = Object.assign(query, { prid: room._id });

			const { cursor, totalCount } = RoomsRaw.findPaginated(ourQuery, {
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
	{
		authRequired: true,
		validateParams: isGETAdminRooms,
	},
	{
		get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { types, filter } = this.requestParams();

			return API.v1.success(
				Promise.await(
					findAdminRooms({
						uid: this.userId,
						filter,
						types,
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.autocomplete.adminRooms',
	{
		authRequired: true,
		validateParams: isGETAutocompleteAdminRooms,
	},
	{
		get() {
			const { selector } = this.queryParams;

			return API.v1.success(
				Promise.await(
					findAdminRoomsAutocomplete({
						uid: this.userId,
						selector: JSON.parse(selector),
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.adminRooms.getRoom',
	{
		authRequired: true,
		validateParams: isGETAdminRoomsGetRoom,
	},
	{
		get() {
			const { rid } = this.requestParams() as string;
			const room = Promise.await(
				findAdminRoom({
					uid: this.userId,
					rid,
				}),
			) as IRoom;

			return API.v1.success(room);
		},
	},
);

API.v1.addRoute(
	'rooms.autocomplete.channelAndPrivate',
	{
		authRequired: true,
		validateParams: isGETAutocompleteChannelAndPrivate,
	},
	{
		get() {
			const { selector } = this.queryParams;

			return API.v1.success(
				Promise.await(
					findChannelAndPrivateAutocomplete({
						uid: this.userId,
						selector: JSON.parse(selector),
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.autocomplete.channelAndPrivate.withPagination',
	{
		authRequired: true,
		validateParams: isGETAutocompleteChannelAndPrivateWithPagination,
	},
	{
		get() {
			const { selector } = this.queryParams;
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const result = {
				offset,
				count,
				...Promise.await(
					findChannelAndPrivateAutocompleteWithPagination({
						uid: this.userId,
						selector: JSON.parse(selector),
						pagination: {
							offset,
							count,
							sort,
						},
					}),
				),
			};

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'rooms.autocomplete.availableForTeams',
	{
		authRequired: true,
		validateParams: isGETAutocompleteAvailableForTeams,
	},
	{
		get() {
			const { name } = this.queryParams;

			return API.v1.success(
				Promise.await(
					findRoomsAvailableForTeams({
						uid: this.userId,
						name,
					}),
				),
			);
		},
	},
);

API.v1.addRoute(
	'rooms.saveRoomSettings',
	{
		authRequired: true,
		validateParams: isPOSTSaveRoomSettings,
	},
	{
		post() {
			const { rid, ...params } = this.bodyParams;

			const result = Meteor.call('saveRoomSettings', rid, params);

			return API.v1.success({ rid: result.rid });
		},
	},
);

API.v1.addRoute(
	'rooms.changeArchivationState',
	{
		authRequired: true,
		validateParams: isPOSTChangeArchivationState,
	},
	{
		post() {
			const { rid, action } = this.bodyParams;

			let result;
			if (action === 'archive') {
				result = Meteor.call('archiveRoom', rid);
			} else {
				result = Meteor.call('unarchiveRoom', rid);
			}

			return API.v1.success({ result });
		},
	},
);

API.v1.addRoute(
	'rooms.export',
	{
		authRequired: true,
		validateParams: isPOSTRoomsExport,
	},
	{
		post() {
			const { rid, type } = this.bodyParams;

			if (!hasPermission(this.userId, 'mail-messages', rid)) {
				throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed');
			}

			const room = Rooms.findOneById(rid);
			if (!room) {
				throw new Meteor.Error('error-invalid-room');
			}

			const user = Meteor.users.findOne({ _id: this.userId }) as IUser;

			if (!canAccessRoom(room, user)) {
				throw new Meteor.Error('error-not-allowed', 'Not Allowed');
			}

			if (type === 'file') {
				let { dateFrom, dateTo } = this.bodyParams;
				const { format } = this.bodyParams;

				if (!['html', 'json'].includes(format)) {
					throw new Meteor.Error('error-invalid-format');
				}

				dateFrom = new Date(dateFrom);
				dateTo = new Date(dateTo);
				dateTo.setDate(dateTo.getDate() + 1);

				sendFile(
					{
						rid,
						format,
						dateFrom,
						dateTo,
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

				const result = sendViaEmail(
					{
						rid,
						toUsers,
						toEmails,
						subject,
						messages,
						language: user.language as string,
					},
					user,
				);

				return API.v1.success(
					result as {
						missing: string[];
					},
				);
			}

			return API.v1.failure('Could not export room');
		},
	},
);
