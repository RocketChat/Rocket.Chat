import { mkdir, writeFile } from 'fs/promises';

import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Messages as MessagesRaw } from '@rocket.chat/models';
import type { IMessage, IRoom, IUser, MessageAttachment, FileProp, RoomType } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { joinPath } from '../fileUtils';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { Messages } from '../../../app/models/server';

const hideUserName = (
	username: string,
	userData: Pick<IUser, 'username'> | undefined,
	usersMap: { userNameTable: Record<string, string> },
) => {
	if (!usersMap.userNameTable) {
		usersMap.userNameTable = {};
	}

	if (!usersMap.userNameTable[username]) {
		if (userData && username === userData.username) {
			usersMap.userNameTable[username] = username;
		} else {
			usersMap.userNameTable[username] = `User_${Object.keys(usersMap.userNameTable).length + 1}`;
		}
	}

	return usersMap.userNameTable[username];
};

const getAttachmentData = (attachment: MessageAttachment, message: IMessage) => {
	return {
		type: 'type' in attachment ? attachment.type : undefined,
		title: attachment.title,
		title_link: attachment.title_link,
		image_url: 'image_url' in attachment ? attachment.image_url : undefined,
		audio_url: 'audio_url' in attachment ? attachment.audio_url : undefined,
		video_url: 'video_url' in attachment ? attachment.video_url : undefined,
		message_link: 'message_link' in attachment ? attachment.message_link : undefined,
		image_type: 'image_type' in attachment ? attachment.image_type : undefined,
		image_size: 'image_size' in attachment ? attachment.image_size : undefined,
		video_size: 'video_size' in attachment ? attachment.video_size : undefined,
		video_type: 'video_type' in attachment ? attachment.video_type : undefined,
		audio_size: 'audio_size' in attachment ? attachment.audio_size : undefined,
		audio_type: 'audio_type' in attachment ? attachment.audio_type : undefined,
		url:
			attachment.title_link ||
			('image_url' in attachment ? attachment.image_url : undefined) ||
			('audio_url' in attachment ? attachment.audio_url : undefined) ||
			('video_url' in attachment ? attachment.video_url : undefined) ||
			('message_link' in attachment ? attachment.message_link : undefined) ||
			null,
		remote: !message.file?._id,
		fileId: message.file?._id,
		fileName: message.file?.name,
	};
};

type MessageData = Pick<IMessage, 'msg' | 'ts'> & {
	username?: IUser['username'] | IUser['name'];
	attachments?: ReturnType<typeof getAttachmentData>[];
	type?: IMessage['t'];
};

const getMessageData = (
	msg: IMessage,
	hideUsers: boolean,
	userData: Pick<IUser, 'username'> | undefined,
	usersMap: { userNameTable: Record<string, string> },
): MessageData => {
	const username = hideUsers ? hideUserName(msg.u.username || msg.u.name, userData, usersMap) : msg.u.username;

	const messageObject = {
		msg: msg.msg,
		username,
		ts: msg.ts,
		...(msg.attachments && {
			attachments: msg.attachments.map((attachment) => getAttachmentData(attachment, msg)),
		}),
		...(msg.t && { type: msg.t }),
	};

	switch (msg.t) {
		case 'uj':
			messageObject.msg = TAPi18n.__('User_joined_the_channel');
			break;
		case 'ul':
			messageObject.msg = TAPi18n.__('User_left_this_channel');
			break;
		case 'ult':
			messageObject.msg = TAPi18n.__('User_left_this_team');
			break;
		case 'user-added-room-to-team':
			messageObject.msg = TAPi18n.__('added__roomName__to_this_team', {
				roomName: msg.msg,
			});
			break;
		case 'user-converted-to-team':
			messageObject.msg = TAPi18n.__('Converted__roomName__to_a_team', {
				roomName: msg.msg,
			});
			break;
		case 'user-converted-to-channel':
			messageObject.msg = TAPi18n.__('Converted__roomName__to_a_channel', {
				roomName: msg.msg,
			});
			break;
		case 'user-deleted-room-from-team':
			messageObject.msg = TAPi18n.__('Deleted__roomName__room', {
				roomName: msg.msg,
			});
			break;
		case 'user-removed-room-from-team':
			messageObject.msg = TAPi18n.__('Removed__roomName__from_the_team', {
				roomName: msg.msg,
			});
			break;
		case 'ujt':
			messageObject.msg = TAPi18n.__('User_joined_the_team');
			break;
		case 'au':
			messageObject.msg = TAPi18n.__('User_added_to', {
				user_added: hideUserName(msg.msg, userData, usersMap),
				user_by: username,
			});
			break;
		case 'added-user-to-team':
			messageObject.msg = TAPi18n.__('Added__username__to_this_team', {
				user_added: msg.msg,
			});
			break;
		case 'r':
			messageObject.msg = TAPi18n.__('Room_name_changed_to', {
				room_name: msg.msg,
				user_by: username,
			});
			break;
		case 'ru':
			messageObject.msg = TAPi18n.__('User_has_been_removed', {
				user_removed: hideUserName(msg.msg, userData, usersMap),
				user_by: username,
			});
			break;
		case 'removed-user-from-team':
			messageObject.msg = TAPi18n.__('Removed__username__from_the_team', {
				user_removed: hideUserName(msg.msg, userData, usersMap),
			});
			break;
		case 'wm':
			messageObject.msg = TAPi18n.__('Welcome', { user: username });
			break;
		case 'livechat-close':
			messageObject.msg = TAPi18n.__('Conversation_finished');
			break;
		case 'livechat-started':
			messageObject.msg = TAPi18n.__('Chat_started');
			break;
	}

	return messageObject;
};

const exportMessageObject = (type: 'json' | 'html', messageObject: MessageData, messageFile?: FileProp): string => {
	if (type === 'json') {
		return JSON.stringify(messageObject);
	}

	const file = [];

	const messageType = messageObject.type;
	const timestamp = messageObject.ts ? new Date(messageObject.ts).toUTCString() : '';

	const italicTypes: IMessage['t'][] = ['uj', 'ul', 'au', 'r', 'ru', 'wm', 'livechat-close'];

	const message = italicTypes.includes(messageType) ? `<i>${messageObject.msg}</i>` : messageObject.msg;

	file.push(`<p><strong>${messageObject.username}</strong> (${timestamp}):<br/>`);
	file.push(message);

	if (messageFile?._id) {
		const attachment = messageObject.attachments?.find((att) => att.type === 'file' && att.title_link?.includes(messageFile._id));

		const description = attachment?.title || TAPi18n.__('Message_Attachments');

		const assetUrl = `./assets/${messageFile._id}-${messageFile.name}`;
		const link = `<br/><a href="${assetUrl}">${description}</a>`;
		file.push(link);
	}

	file.push('</p>');

	return file.join('\n');
};

const exportRoomMessages = async (
	rid: IRoom['_id'],
	exportType: 'json' | 'html',
	skip: number,
	limit: number,
	userData: any,
	filter: any = {},
	usersMap: any = {},
	hideUsers = true,
) => {
	const readPreference = readSecondaryPreferred(Messages.model.rawDatabase());

	// @ts-ignore Circular reference on field 'attachments'
	const { cursor, totalCount } = MessagesRaw.findPaginated(
		{ ...filter, rid },
		{
			sort: { ts: 1 },
			skip,
			limit,
			readPreference,
		},
	);

	const [results, total] = await Promise.all([cursor.toArray(), totalCount]);

	const result = {
		total,
		exported: results.length,
		messages: [] as string[],
		uploads: [] as FileProp[],
	};

	results.forEach(
		Meteor.bindEnvironment((msg) => {
			const messageObject = getMessageData(msg, hideUsers, userData, usersMap);

			if (msg.file) {
				result.uploads.push(msg.file);
			}

			result.messages.push(exportMessageObject(exportType, messageObject, msg.file));
		}),
	);

	return result;
};

export const exportRoomMessagesToFile = async function (
	exportPath: string,
	assetsPath: string,
	exportType: 'json' | 'html',
	roomList: (
		| {
				roomId: string;
				roomName: string;
				userId: string | undefined;
				exportedCount: number;
				status: string;
				type: RoomType;
				targetFile: string;
		  }
		| Record<string, never>
	)[],
	userData: IUser,
	messagesFilter = {},
	usersMap = {},
	hideUsers = true,
) {
	await mkdir(exportPath, { recursive: true });
	await mkdir(assetsPath, { recursive: true });

	const result = {
		fileList: [] as FileProp[],
	};

	const limit =
		settings.get<number>('UserData_MessageLimitPerRequest') > 0 ? settings.get<number>('UserData_MessageLimitPerRequest') : 1000;
	for await (const exportOpRoomData of roomList) {
		if (!('targetFile' in exportOpRoomData)) {
			continue;
		}

		const filePath = joinPath(exportPath, exportOpRoomData.targetFile);
		if (exportOpRoomData.status === 'pending') {
			exportOpRoomData.status = 'exporting';
			if (exportType === 'html') {
				await writeFile(filePath, '<meta http-equiv="content-type" content="text/html; charset=utf-8">', { encoding: 'utf8' });
			}
		}

		const skip = exportOpRoomData.exportedCount;

		const { total, exported, uploads, messages } = await exportRoomMessages(
			exportOpRoomData.roomId,
			exportType,
			skip,
			limit,
			userData,
			messagesFilter,
			usersMap,
			hideUsers,
		);

		result.fileList.push(...uploads);

		exportOpRoomData.exportedCount += exported;

		if (total <= exportOpRoomData.exportedCount) {
			exportOpRoomData.status = 'completed';
		}

		await writeFile(filePath, `${messages.join('\n')}\n`, { encoding: 'utf8', flag: 'a' });
	}

	return result;
};
