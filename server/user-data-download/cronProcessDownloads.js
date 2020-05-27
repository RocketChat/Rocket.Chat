import fs from 'fs';
import path from 'path';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import archiver from 'archiver';

import { settings } from '../../app/settings';
import { Subscriptions, Rooms, Users, Uploads, Messages, UserDataFiles, ExportOperations, Avatars } from '../../app/models';
import { FileUpload } from '../../app/file-upload';
import * as Mailer from '../mailer';

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

const startFile = function(fileName, content) {
	fs.writeFileSync(fileName, content);
};

const writeToFile = function(fileName, content) {
	fs.appendFileSync(fileName, content);
};

const createDir = function(folderName) {
	if (!fs.existsSync(folderName)) {
		fs.mkdirSync(folderName, { recursive: true });
	}
};

const loadUserSubscriptions = function(exportOperation) {
	exportOperation.roomList = [];

	const exportUserId = exportOperation.userId;
	const cursor = Subscriptions.findByUserId(exportUserId);
	cursor.forEach((subscription) => {
		const roomId = subscription.rid;
		const roomData = Rooms.findOneById(roomId);
		const roomName = roomData && roomData.name && subscription.t !== 'd' ? roomData.name : roomId;
		const [userId] = subscription.t === 'd' ? roomData.uids.filter((uid) => uid !== exportUserId) : [null];
		const fileName = exportOperation.fullExport ? roomId : roomName;
		const fileType = exportOperation.fullExport ? 'json' : 'html';
		const targetFile = `${ fileName }.${ fileType }`;

		exportOperation.roomList.push({
			roomId,
			roomName,
			userId,
			exportedCount: 0,
			status: 'pending',
			targetFile,
			type: subscription.t,
		});
	});

	if (exportOperation.fullExport) {
		exportOperation.status = 'exporting-rooms';
	} else {
		exportOperation.status = 'exporting';
	}
};

const getAttachmentData = function(attachment) {
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

		const urlMatch = /\:\/\//.exec(url);
		if (urlMatch && urlMatch.length > 0) {
			attachmentData.remote = true;
		} else {
			const match = /^\/([^\/]+)\/([^\/]+)\/(.*)/.exec(url);

			if (match && match[2]) {
				const file = Uploads.findOneById(match[2]);

				if (file) {
					attachmentData.fileId = file._id;
					attachmentData.fileName = file.name;
				}
			}
		}
	}

	return attachmentData;
};

const addToFileList = function(exportOperation, attachment) {
	const targetFile = path.join(exportOperation.assetsPath, `${ attachment.fileId }-${ attachment.fileName }`);

	const attachmentData = {
		url: attachment.url,
		copied: false,
		remote: attachment.remote,
		fileId: attachment.fileId,
		fileName: attachment.fileName,
		targetFile,
	};

	exportOperation.fileList.push(attachmentData);
};

const hideUserName = function(username, exportOperation) {
	if (!exportOperation.userNameTable) {
		exportOperation.userNameTable = {};
	}

	if (!exportOperation.userNameTable[username]) {
		if (exportOperation.userData && username === exportOperation.userData.username) {
			exportOperation.userNameTable[username] = username;
		} else {
			exportOperation.userNameTable[username] = `User_${ Object.keys(exportOperation.userNameTable).length + 1 }`;
		}
	}

	return exportOperation.userNameTable[username];
};

const getMessageData = function(msg, exportOperation) {
	const attachments = [];

	if (msg.attachments) {
		msg.attachments.forEach((attachment) => {
			const attachmentData = getAttachmentData(attachment);

			attachments.push(attachmentData);
			addToFileList(exportOperation, attachmentData);
		});
	}

	const username = hideUserName(msg.u.username || msg.u.name, exportOperation);

	const messageObject = {
		msg: msg.msg,
		username,
		ts: msg.ts,
	};

	if (attachments && attachments.length > 0) {
		messageObject.attachments = attachments;
	}

	if (msg.t) {
		messageObject.type = msg.t;

		switch (msg.t) {
			case 'uj':
				messageObject.msg = TAPi18n.__('User_joined_channel');
				break;
			case 'ul':
				messageObject.msg = TAPi18n.__('User_left');
				break;
			case 'au':
				messageObject.msg = TAPi18n.__('User_added_by', { user_added: hideUserName(msg.msg, exportOperation), user_by: username });
				break;
			case 'r':
				messageObject.msg = TAPi18n.__('Room_name_changed', { room_name: msg.msg, user_by: username });
				break;
			case 'ru':
				messageObject.msg = TAPi18n.__('User_removed_by', { user_removed: hideUserName(msg.msg, exportOperation), user_by: username });
				break;
			case 'wm':
				messageObject.msg = TAPi18n.__('Welcome', { user: username });
				break;
			case 'livechat-close':
				messageObject.msg = TAPi18n.__('Conversation_finished');
				break;
		}
	}

	return messageObject;
};

const copyFile = function(exportOperation, attachmentData) {
	if (attachmentData.copied || attachmentData.remote || !attachmentData.fileId) {
		attachmentData.copied = true;
		return;
	}

	const file = Uploads.findOneById(attachmentData.fileId);

	if (file) {
		if (FileUpload.copy(file, attachmentData.targetFile)) {
			attachmentData.copied = true;
		}
	}
};

const continueExportingRoom = function(exportOperation, exportOpRoomData) {
	createDir(exportOperation.exportPath);
	createDir(exportOperation.assetsPath);

	const filePath = path.join(exportOperation.exportPath, exportOpRoomData.targetFile);

	if (exportOpRoomData.status === 'pending') {
		exportOpRoomData.status = 'exporting';
		startFile(filePath, '');
		if (!exportOperation.fullExport) {
			writeToFile(filePath, '<meta http-equiv="content-type" content="text/html; charset=utf-8">');
		}
	}

	let limit = 1000;
	if (settings.get('UserData_MessageLimitPerRequest') > 0) {
		limit = settings.get('UserData_MessageLimitPerRequest');
	}

	const skip = exportOpRoomData.exportedCount;
	const cursor = Messages.model.rawCollection().aggregate([
		{ $match: { rid: exportOpRoomData.roomId } },
		{ $sort: { ts: 1 } },
		{ $skip: skip },
		{ $limit: limit },
	]);

	const findCursor = Messages.findByRoomId(exportOpRoomData.roomId, { limit: 1 });
	const count = findCursor.count();

	cursor.forEach(Meteor.bindEnvironment((msg) => {
		const messageObject = getMessageData(msg, exportOperation);

		if (exportOperation.fullExport) {
			const messageString = JSON.stringify(messageObject);
			writeToFile(filePath, `${ messageString }\n`);
		} else {
			const messageType = messageObject.type;
			const timestamp = msg.ts ? new Date(msg.ts).toUTCString() : '';
			let message = messageObject.msg;

			const italicTypes = ['uj', 'ul', 'au', 'r', 'ru', 'wm', 'livechat-close'];

			if (italicTypes.includes(messageType)) {
				message = `<i>${ message }</i>`;
			}

			writeToFile(filePath, `<p><strong>${ messageObject.username }</strong> (${ timestamp }):<br/>`);
			writeToFile(filePath, message);

			if (messageObject.attachments && messageObject.attachments.length > 0) {
				messageObject.attachments.forEach((attachment) => {
					if (attachment.type === 'file') {
						const description = attachment.description || attachment.title || TAPi18n.__('Message_Attachments');

						const assetUrl = `./assets/${ attachment.fileId }-${ attachment.fileName }`;
						const link = `<br/><a href="${ assetUrl }">${ description }</a>`;
						writeToFile(filePath, link);
					}
				});
			}

			writeToFile(filePath, '</p>');
		}

		exportOpRoomData.exportedCount++;
	}));

	if (count <= exportOpRoomData.exportedCount) {
		exportOpRoomData.status = 'completed';
		return true;
	}

	return false;
};

const isExportComplete = function(exportOperation) {
	const incomplete = exportOperation.roomList.some((exportOpRoomData) => exportOpRoomData.status !== 'completed');

	return !incomplete;
};

const isDownloadFinished = function(exportOperation) {
	const anyDownloadPending = exportOperation.fileList.some((fileData) => !fileData.copied && !fileData.remote);

	return !anyDownloadPending;
};

const sendEmail = function(userId, fileId) {
	const file = fileId ? UserDataFiles.findOneById(fileId) : UserDataFiles.findLastFileByUser(userId);
	if (!file) {
		return;
	}
	const userData = Users.findOneById(userId);

	if (!userData || !userData.emails || !userData.emails[0] || !userData.emails[0].address) {
		return;
	}
	const emailAddress = `${ userData.name } <${ userData.emails[0].address }>`;
	const fromAddress = settings.get('From_Email');
	const subject = TAPi18n.__('UserDataDownload_EmailSubject');

	const download_link = file.url;
	const body = TAPi18n.__('UserDataDownload_EmailBody', { download_link });

	if (!Mailer.checkAddressFormat(emailAddress)) {
		return;
	}

	return Mailer.sendNoWrap({
		to: emailAddress,
		from: fromAddress,
		subject,
		html: body,
	});
};

const makeZipFile = function(exportOperation) {
	createDir(zipFolder);

	const targetFile = path.join(zipFolder, `${ exportOperation.userId }.zip`);
	if (fs.existsSync(targetFile)) {
		exportOperation.status = 'uploading';
		return;
	}

	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(targetFile);

		exportOperation.generatedFile = targetFile;

		const archive = archiver('zip');

		output.on('close', () => {
			exportOperation.status = 'uploading';
			resolve();
		});

		archive.on('error', (err) => {
			reject(err);
		});

		archive.pipe(output);
		archive.directory(exportOperation.exportPath, false);
		archive.finalize();
	});
};

const uploadZipFile = function(exportOperation, callback) {
	const userDataStore = FileUpload.getStore('UserDataFiles');
	const filePath = exportOperation.generatedFile;

	const stat = Meteor.wrapAsync(fs.stat)(filePath);
	const stream = fs.createReadStream(filePath);

	const contentType = 'application/zip';
	const { size } = stat;

	const { userId } = exportOperation;
	const user = Users.findOneById(userId);
	let userDisplayName = userId;
	if (user) {
		userDisplayName = user.name || user.username || userId;
	}

	const utcDate = new Date().toISOString().split('T')[0];
	const fileSuffix = exportOperation.fullExport ? '-data' : '';

	const newFileName = encodeURIComponent(`${ utcDate }-${ userDisplayName }${ fileSuffix }.zip`);

	const details = {
		userId,
		type: contentType,
		size,
		name: newFileName,
	};

	const file = userDataStore.insert(details, stream, (err) => {
		if (err) {
			throw new Meteor.Error('invalid-file', 'Invalid Zip File', { method: 'cronProcessDownloads.uploadZipFile' });
		} else {
			callback();
		}
	});

	exportOperation.fileId = file._id;
};

const generateChannelsFile = function(exportOperation) {
	if (exportOperation.fullExport) {
		const fileName = path.join(exportOperation.exportPath, 'channels.json');
		startFile(fileName, '');

		exportOperation.roomList.forEach((roomData) => {
			const newRoomData = {
				roomId: roomData.roomId,
				roomName: roomData.roomName,
				type: roomData.type,
			};

			const messageString = JSON.stringify(newRoomData);
			writeToFile(fileName, `${ messageString }\n`);
		});
	}

	exportOperation.status = 'exporting';
};

const generateUserFile = function(exportOperation) {
	if (!exportOperation.userData) {
		return;
	}

	const { username, name, statusText, emails, roles, services } = exportOperation.userData;

	const dataToSave = {
		username,
		name,
		statusText,
		emails: _.pluck(emails, 'address'),
		roles,
		services: Object.keys(services),
	};

	const fileName = path.join(exportOperation.exportPath, exportOperation.fullExport ? 'user.json' : 'user.html');
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

		writeToFile(fileName, `<p><strong>${ key }</strong>:`);
		if (typeof value === 'string') {
			writeToFile(fileName, value);
		} else if (Array.isArray(value)) {
			writeToFile(fileName, '<br/>');

			for (const item of value) {
				writeToFile(fileName, `${ item }<br/>`);
			}
		}

		writeToFile(fileName, '</p>');
	}
};

const generateUserAvatarFile = function(exportOperation) {
	if (!exportOperation.userData) {
		return;
	}

	const file = Avatars.findOneByName(exportOperation.userData.username);
	if (!file) {
		return;
	}

	const filePath = path.join(exportOperation.exportPath, 'avatar');
	if (FileUpload.copy(file, filePath)) {
		exportOperation.generatedAvatar = true;
	}
};

const continueExportOperation = async function(exportOperation) {
	if (exportOperation.status === 'completed') {
		return;
	}

	if (!exportOperation.roomList) {
		loadUserSubscriptions(exportOperation);
	}

	try {
		if (!exportOperation.generatedUserFile) {
			generateUserFile(exportOperation);
		}

		if (!exportOperation.generatedAvatar) {
			generateUserAvatarFile(exportOperation);
		}

		if (exportOperation.status === 'exporting-rooms') {
			generateChannelsFile(exportOperation);
		}

		// Run every room on every request, to avoid missing new messages on the rooms that finished first.
		if (exportOperation.status === 'exporting') {
			exportOperation.roomList.forEach((exportOpRoomData) => {
				continueExportingRoom(exportOperation, exportOpRoomData);
			});

			if (isExportComplete(exportOperation)) {
				exportOperation.status = 'downloading';
			}
		}

		if (exportOperation.status === 'downloading') {
			exportOperation.fileList.forEach((attachmentData) => {
				copyFile(exportOperation, attachmentData);
			});

			if (isDownloadFinished(exportOperation)) {
				const targetFile = path.join(zipFolder, `${ exportOperation.userId }.zip`);
				if (fs.existsSync(targetFile)) {
					fs.unlinkSync(targetFile);
				}

				exportOperation.status = 'compressing';
			}
		}

		if (exportOperation.status === 'compressing') {
			await makeZipFile(exportOperation);
		}

		if (exportOperation.status === 'uploading') {
			uploadZipFile(exportOperation, () => {
				exportOperation.status = 'completed';
				ExportOperations.updateOperation(exportOperation);
			});
		}

		ExportOperations.updateOperation(exportOperation);
	} catch (e) {
		console.error(e);
	}
};

async function processDataDownloads() {
	const operation = ExportOperations.findOnePending();
	if (!operation) {
		return;
	}

	if (operation.status === 'completed') {
		return;
	}

	await continueExportOperation(operation);
	await ExportOperations.updateOperation(operation);

	if (operation.status === 'completed') {
		sendEmail(operation.userId, operation.fileId);
	}
}

const name = 'Generate download files for user data';

Meteor.startup(function() {
	Meteor.defer(function() {
		let TroubleshootDisableDataExporterProcessor;
		settings.get('Troubleshoot_Disable_Data_Exporter_Processor', (key, value) => {
			if (TroubleshootDisableDataExporterProcessor === value) { return; }
			TroubleshootDisableDataExporterProcessor = value;

			if (value) {
				return SyncedCron.remove(name);
			}

			SyncedCron.add({
				name,
				schedule: (parser) => parser.cron(`*/${ processingFrequency } * * * *`),
				job: processDataDownloads,
			});
		});
	});
});
