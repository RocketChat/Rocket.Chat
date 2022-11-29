import fs from 'fs';
import util from 'util';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import archiver from 'archiver';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Avatars, ExportOperations, Messages as MessagesRaw, UserDataFiles, Uploads } from '@rocket.chat/models';

import { settings } from '../../settings/server';
import { Subscriptions, Rooms, Users, Messages } from '../../models/server';
import { FileUpload } from '../../file-upload/server';
import { DataExport } from './DataExport';
import * as Mailer from '../../mailer';
import { readSecondaryPreferred } from '../../../server/database/readSecondaryPreferred';
import { joinPath } from '../../../server/lib/fileUtils';
import { getURL } from '../../utils/lib/getURL';

const fsStat = util.promisify(fs.stat);
const fsOpen = util.promisify(fs.open);
const fsExists = util.promisify(fs.exists);
const fsUnlink = util.promisify(fs.unlink);

let zipFolder = '/tmp/zipFiles';
if (settings.get('UserData_FileSystemZipPath') != null) {
	if (settings.get('UserData_FileSystemZipPath').trim() !== '') {
		zipFolder = settings.get('UserData_FileSystemZipPath');
	}
}

let processingFrequency = 2;
if (settings.get('UserData_ProcessingFrequency') > 0) {
	processingFrequency = settings.get('UserData_ProcessingFrequency');
}

const startFile = function (fileName, content) {
	fs.writeFileSync(fileName, content);
};

const writeToFile = function (fileName, content) {
	fs.appendFileSync(fileName, content);
};

const createDir = function (folderName) {
	if (!fs.existsSync(folderName)) {
		fs.mkdirSync(folderName, { recursive: true });
	}
};

export const getRoomData = (roomId, ownUserId) => {
	const roomData = Rooms.findOneById(roomId);

	if (!roomData) {
		return {};
	}

	const roomName = roomData.name && roomData.t !== 'd' ? roomData.name : roomId;
	const [userId] = roomData.t === 'd' ? roomData.uids.filter((uid) => uid !== ownUserId) : [null];

	return {
		roomId,
		roomName,
		userId,
		exportedCount: 0,
		status: 'pending',
		type: roomData.t,
		targetFile: '',
	};
};

export const loadUserSubscriptions = function (exportOperation, fileType, userId) {
	const roomList = [];

	const cursor = Subscriptions.findByUserId(userId);
	cursor.forEach((subscription) => {
		const roomData = getRoomData(subscription.rid, userId);
		const targetFile = `${(fileType === 'json' && roomData.roomName) || subscription.rid}.${fileType}`;

		roomList.push({
			...roomData,
			targetFile,
		});
	});

	return roomList;
};

const getAttachmentData = function (attachment, message) {
	const attachmentData = {
		type: attachment.type,
		title: attachment.title,
		title_link: attachment.title_link,
		image_url: attachment.image_url,
		audio_url: attachment.audio_url,
		video_url: attachment.video_url,
		message_link: attachment.message_link,
		image_type: attachment.image_type,
		image_size: attachment.image_size,
		video_size: attachment.video_size,
		video_type: attachment.video_type,
		audio_size: attachment.audio_size,
		audio_type: attachment.audio_type,
		url: null,
		remote: false,
		fileId: null,
		fileName: null,
	};

	const url = attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url || attachment.message_link;
	if (url) {
		attachmentData.url = url;
	}

	if (message.file?._id) {
		attachmentData.fileId = message.file._id;
		attachmentData.fileName = message.file.name;
	} else {
		attachmentData.remote = true;
	}

	return attachmentData;
};

const hideUserName = function (username, userData, usersMap) {
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

const getMessageData = function (msg, hideUsers, userData, usersMap) {
	const username = hideUsers ? hideUserName(msg.u.username || msg.u.name, userData, usersMap) : msg.u.username;

	const messageObject = {
		msg: msg.msg,
		username,
		ts: msg.ts,
		...(msg.attachments && {
			attachments: msg.attachments.map((attachment) => getAttachmentData(attachment, msg)),
		}),
	};

	if (msg.t) {
		messageObject.type = msg.t;

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
	}

	return messageObject;
};

export const copyFile = async function (attachmentData, assetsPath) {
	const file = await Uploads.findOneById(attachmentData._id);
	if (!file) {
		return;
	}
	FileUpload.copy(file, joinPath(assetsPath, `${attachmentData._id}-${attachmentData.name}`));
};

const exportMessageObject = (type, messageObject, messageFile) => {
	if (type === 'json') {
		return JSON.stringify(messageObject);
	}

	const file = [];

	const messageType = messageObject.type;
	const timestamp = messageObject.ts ? new Date(messageObject.ts).toUTCString() : '';

	const italicTypes = ['uj', 'ul', 'au', 'r', 'ru', 'wm', 'livechat-close'];

	const message = italicTypes.includes(messageType) ? `<i>${messageObject.msg}</i>` : messageObject.msg;

	file.push(`<p><strong>${messageObject.username}</strong> (${timestamp}):<br/>`);
	file.push(message);

	if (messageFile?._id) {
		const attachment = messageObject.attachments.find((att) => att.type === 'file' && att.title_link.includes(messageFile._id));

		const description = attachment?.description || attachment?.title || TAPi18n.__('Message_Attachments');

		const assetUrl = `./assets/${messageFile._id}-${messageFile.name}`;
		const link = `<br/><a href="${assetUrl}">${description}</a>`;
		file.push(link);
	}

	file.push('</p>');

	return file.join('\n');
};

export async function exportRoomMessages(
	rid,
	exportType,
	skip,
	limit,
	assetsPath,
	exportOpRoomData,
	userData,
	filter = {},
	usersMap = {},
	hideUsers = true,
) {
	const query = { ...filter, rid };

	const readPreference = readSecondaryPreferred(Messages.model.rawDatabase());

	const { cursor, totalCount } = MessagesRaw.findPaginated(query, {
		sort: { ts: 1 },
		skip,
		limit,
		readPreference,
	});

	const [results, total] = await Promise.all([cursor.toArray(), totalCount]);

	const result = {
		total,
		exported: results.length,
		messages: [],
		uploads: [],
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
}

export const isExportComplete = function (exportOperation) {
	const incomplete = exportOperation.roomList.some((exportOpRoomData) => exportOpRoomData.status !== 'completed');

	return !incomplete;
};

export const sendEmail = function (userData, subject, body) {
	const emailAddress = `${userData.name} <${userData.emails[0].address}>`;
	const fromAddress = settings.get('From_Email');

	if (!Mailer.checkAddressFormat(emailAddress)) {
		return;
	}

	return Mailer.send({
		to: emailAddress,
		from: fromAddress,
		subject,
		html: body,
	});
};

export const makeZipFile = function (folderToZip, targetFile) {
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(targetFile);

		const archive = archiver('zip');

		output.on('close', () => resolve());

		archive.on('error', (err) => reject(err));

		archive.pipe(output);
		archive.directory(folderToZip, false);
		archive.finalize();
	});
};

export const uploadZipFile = async function (filePath, userId, exportType) {
	const stat = await fsStat(filePath);

	const contentType = 'application/zip';
	const { size } = stat;

	const user = Users.findOneById(userId);
	let userDisplayName = userId;
	if (user) {
		userDisplayName = user.name || user.username || userId;
	}

	const utcDate = new Date().toISOString().split('T')[0];
	const fileSuffix = exportType === 'json' ? '-data' : '';

	const newFileName = encodeURIComponent(`${utcDate}-${userDisplayName}${fileSuffix}.zip`);

	const details = {
		userId,
		type: contentType,
		size,
		name: newFileName,
	};

	const fd = await fsOpen(filePath);

	const stream = fs.createReadStream('', { fd });

	const userDataStore = FileUpload.getStore('UserDataFiles');

	const file = userDataStore.insertSync(details, stream);

	fs.close(fd);

	return file;
};

const generateChannelsFile = function (type, exportPath, exportOperation) {
	if (type !== 'json') {
		return;
	}

	const fileName = joinPath(exportPath, 'channels.json');
	startFile(
		fileName,
		exportOperation.roomList
			.map((roomData) =>
				JSON.stringify({
					roomId: roomData.roomId,
					roomName: roomData.roomName,
					type: roomData.type,
				}),
			)
			.join('\n'),
	);
};

export const exportRoomMessagesToFile = async function (
	exportPath,
	assetsPath,
	exportType,
	roomList,
	userData,
	messagesFilter = {},
	usersMap = {},
	hideUsers = true,
) {
	createDir(exportPath);
	createDir(assetsPath);

	const result = {
		fileList: [],
	};

	const limit = settings.get('UserData_MessageLimitPerRequest') > 0 ? settings.get('UserData_MessageLimitPerRequest') : 1000;
	for await (const exportOpRoomData of roomList) {
		const filePath = joinPath(exportPath, exportOpRoomData.targetFile);
		if (exportOpRoomData.status === 'pending') {
			exportOpRoomData.status = 'exporting';
			startFile(filePath, exportType === 'html' ? '<meta http-equiv="content-type" content="text/html; charset=utf-8">' : '');
		}

		const skip = exportOpRoomData.exportedCount;

		const { total, exported, uploads, messages } = await exportRoomMessages(
			exportOpRoomData.roomId,
			exportType,
			skip,
			limit,
			assetsPath,
			exportOpRoomData,
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

		writeToFile(filePath, `${messages.join('\n')}\n`);
	}

	return result;
};

const generateUserFile = function (exportOperation, userData) {
	if (!userData) {
		return;
	}

	const { username, name, statusText, emails, roles, services } = userData;

	const dataToSave = {
		username,
		name,
		statusText,
		emails: _.pluck(emails, 'address'),
		roles,
		services: Object.keys(services),
	};

	const fileName = joinPath(exportOperation.exportPath, exportOperation.fullExport ? 'user.json' : 'user.html');
	startFile(fileName, '');

	if (exportOperation.fullExport) {
		writeToFile(fileName, JSON.stringify(dataToSave));

		exportOperation.generatedUserFile = true;
		return;
	}

	writeToFile(fileName, '<meta http-equiv="content-type" content="text/html; charset=utf-8">');
	for (const key in dataToSave) {
		if (!dataToSave.hasOwnProperty(key)) {
			continue;
		}

		const value = dataToSave[key];

		writeToFile(fileName, `<p><strong>${key}</strong>:`);
		if (typeof value === 'string') {
			writeToFile(fileName, value);
		} else if (Array.isArray(value)) {
			writeToFile(fileName, '<br/>');

			for (const item of value) {
				writeToFile(fileName, `${item}<br/>`);
			}
		}

		writeToFile(fileName, '</p>');
	}
};

const generateUserAvatarFile = async function (exportOperation, userData) {
	if (!userData) {
		return;
	}

	const file = await Avatars.findOneByName(userData.username);
	if (!file) {
		return;
	}

	const filePath = joinPath(exportOperation.exportPath, 'avatar');
	if (FileUpload.copy(file, filePath)) {
		exportOperation.generatedAvatar = true;
	}
};

const continueExportOperation = async function (exportOperation) {
	if (exportOperation.status === 'completed') {
		return;
	}

	const exportType = exportOperation.fullExport ? 'json' : 'html';

	if (!exportOperation.roomList) {
		exportOperation.roomList = loadUserSubscriptions(exportOperation, exportType, exportOperation.userId);

		if (exportOperation.fullExport) {
			exportOperation.status = 'exporting-rooms';
		} else {
			exportOperation.status = 'exporting';
		}
	}

	try {
		if (!exportOperation.generatedUserFile) {
			generateUserFile(exportOperation, exportOperation.userData);
		}

		if (!exportOperation.generatedAvatar) {
			await generateUserAvatarFile(exportOperation, exportOperation.userData);
		}

		if (exportOperation.status === 'exporting-rooms') {
			generateChannelsFile(exportType, exportOperation.exportPath, exportOperation);

			exportOperation.status = 'exporting';
		}

		// Run every room on every request, to avoid missing new messages on the rooms that finished first.
		if (exportOperation.status === 'exporting') {
			const { fileList } = await exportRoomMessagesToFile(
				exportOperation.exportPath,
				exportOperation.assetsPath,
				exportType,
				exportOperation.roomList,
				exportOperation.userData,
				{},
				exportOperation.userNameTable,
			);
			if (!exportOperation.fileList) {
				exportOperation.fileList = [];
			}
			exportOperation.fileList.push(...fileList);

			if (isExportComplete(exportOperation)) {
				exportOperation.status = 'downloading';
			}
		}

		const generatedFileName = uuidv4();

		if (exportOperation.status === 'downloading') {
			for await (const attachmentData of exportOperation.fileList) {
				await copyFile(attachmentData, exportOperation.assetsPath);
			}

			const targetFile = joinPath(zipFolder, `${generatedFileName}.zip`);
			if (await fsExists(targetFile)) {
				await fsUnlink(targetFile);
			}

			exportOperation.status = 'compressing';
		}

		if (exportOperation.status === 'compressing') {
			createDir(zipFolder);

			exportOperation.generatedFile = joinPath(zipFolder, `${generatedFileName}.zip`);
			if (!(await fsExists(exportOperation.generatedFile))) {
				await makeZipFile(exportOperation.exportPath, exportOperation.generatedFile);
			}

			exportOperation.status = 'uploading';
		}

		if (exportOperation.status === 'uploading') {
			const { _id: fileId } = await uploadZipFile(exportOperation.generatedFile, exportOperation.userId, exportType);
			exportOperation.fileId = fileId;

			exportOperation.status = 'completed';
			await ExportOperations.updateOperation(exportOperation);
		}

		await ExportOperations.updateOperation(exportOperation);
	} catch (e) {
		console.error(e);
	}
};

async function processDataDownloads() {
	const operation = await ExportOperations.findOnePending();
	if (!operation) {
		return;
	}

	if (operation.status === 'completed') {
		return;
	}

	if (operation.status !== 'pending') {
		// If the operation has started but was not updated in over a day, then skip it
		if (operation._updatedAt && moment().diff(moment(operation._updatedAt), 'days') > 1) {
			operation.status = 'skipped';
			await ExportOperations.updateOperation(operation);
			return processDataDownloads();
		}
	}

	await continueExportOperation(operation);
	await ExportOperations.updateOperation(operation);

	if (operation.status === 'completed') {
		const file = operation.fileId
			? await UserDataFiles.findOneById(operation.fileId)
			: await UserDataFiles.findLastFileByUser(operation.userId);
		if (!file) {
			return;
		}

		const subject = TAPi18n.__('UserDataDownload_EmailSubject');
		const body = TAPi18n.__('UserDataDownload_EmailBody', {
			download_link: getURL(DataExport.getPath(file._id), { cdn: false, full: true }),
		});

		sendEmail(operation.userData, subject, body);
	}
}

const name = 'Generate download files for user data';

Meteor.startup(function () {
	let TroubleshootDisableDataExporterProcessor;
	settings.watch('Troubleshoot_Disable_Data_Exporter_Processor', (value) => {
		if (TroubleshootDisableDataExporterProcessor === value) {
			return;
		}
		TroubleshootDisableDataExporterProcessor = value;

		if (value) {
			return SyncedCron.remove(name);
		}

		SyncedCron.add({
			name,
			schedule: (parser) => parser.cron(`*/${processingFrequency} * * * *`),
			job: processDataDownloads,
		});
	});
});
