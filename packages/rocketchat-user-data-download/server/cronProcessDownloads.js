/* globals SyncedCron */

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

let zipFolder = '/tmp/zipFiles';
if (RocketChat.settings.get('UserData_FileSystemZipPath') != null) {
	if (RocketChat.settings.get('UserData_FileSystemZipPath').trim() !== '') {
		zipFolder = RocketChat.settings.get('UserData_FileSystemZipPath');
	}
}

let processingFrequency = 15;
if (RocketChat.settings.get('UserData_ProcessingFrequency') > 0) {
	processingFrequency = RocketChat.settings.get('UserData_ProcessingFrequency');
}

const startFile = function(fileName, content) {
	fs.writeFileSync(fileName, content);
};

const writeToFile = function(fileName, content) {
	fs.appendFileSync(fileName, content);
};

const createDir = function(folderName) {
	if (!fs.existsSync(folderName)) {
		fs.mkdirSync(folderName);
	}
};

const loadUserSubscriptions = function(exportOperation) {
	exportOperation.roomList = [];

	const exportUserId = exportOperation.userId;
	const cursor = RocketChat.models.Subscriptions.findByUserId(exportUserId);
	cursor.forEach((subscription) => {
		const roomId = subscription.rid;
		const roomData = subscription._room;
		let roomName = roomData.name ? roomData.name : roomId;
		let userId = null;

		if (subscription.t === 'd') {
			userId = roomId.replace(exportUserId, '');
			const userData = RocketChat.models.Users.findOneById(userId);

			if (userData) {
				roomName = userData.name;
			}
		}

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
			type: subscription.t
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
		type : attachment.type,
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
		fileName: null
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
				const file = RocketChat.models.Uploads.findOneById(match[2]);

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
		targetFile
	};

	exportOperation.fileList.push(attachmentData);
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

	const messageObject = {
		msg: msg.msg,
		username: msg.u.username,
		ts: msg.ts
	};

	if (attachments && attachments.length > 0) {
		messageObject.attachments = attachments;
	}
	if (msg.t) {
		messageObject.type = msg.t;
	}
	if (msg.u.name) {
		messageObject.name = msg.u.name;
	}

	return messageObject;
};

const copyFile = function(exportOperation, attachmentData) {
	if (attachmentData.copied || attachmentData.remote || !attachmentData.fileId) {
		attachmentData.copied = true;
		return;
	}

	const file = RocketChat.models.Uploads.findOneById(attachmentData.fileId);

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

	let limit = 100;
	if (RocketChat.settings.get('UserData_MessageLimitPerRequest') > 0) {
		limit = RocketChat.settings.get('UserData_MessageLimitPerRequest');
	}

	const skip = exportOpRoomData.exportedCount;

	const cursor = RocketChat.models.Messages.findByRoomId(exportOpRoomData.roomId, { limit, skip });
	const count = cursor.count();

	cursor.forEach((msg) => {
		const messageObject = getMessageData(msg, exportOperation);

		if (exportOperation.fullExport) {
			const messageString = JSON.stringify(messageObject);
			writeToFile(filePath, `${ messageString }\n`);
		} else {
			const messageType = msg.t;
			const userName = msg.u.username || msg.u.name;
			const timestamp = msg.ts ? new Date(msg.ts).toUTCString() : '';
			let message = msg.msg;

			switch (messageType) {
				case 'uj':
					message = TAPi18n.__('User_joined_channel');
					break;
				case 'ul':
					message = TAPi18n.__('User_left');
					break;
				case 'au':
					message = TAPi18n.__('User_added_by', {user_added : msg.msg, user_by : msg.u.username });
					break;
				case 'r':
					message = TAPi18n.__('Room_name_changed', { room_name: msg.msg, user_by: msg.u.username });
					break;
				case 'ru':
					message = TAPi18n.__('User_removed_by', {user_removed : msg.msg, user_by : msg.u.username });
					break;
				case 'wm':
					message = TAPi18n.__('Welcome', {user: msg.u.username });
					break;
				case 'livechat-close':
					message = TAPi18n.__('Conversation_finished');
					break;
			}

			if (message !== msg.msg) {
				message = `<i>${ message }</i>`;
			}

			writeToFile(filePath, `<p><strong>${ userName }</strong> (${ timestamp }):<br/>`);
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
	});

	if (count <= exportOpRoomData.exportedCount) {
		exportOpRoomData.status = 'completed';
		return true;
	}

	return false;
};

const isExportComplete = function(exportOperation) {
	const incomplete = exportOperation.roomList.some((exportOpRoomData) => {
		return exportOpRoomData.status !== 'completed';
	});

	return !incomplete;
};

const isDownloadFinished = function(exportOperation) {
	const anyDownloadPending = exportOperation.fileList.some((fileData) => {
		return !fileData.copied && !fileData.remote;
	});

	return !anyDownloadPending;
};

const sendEmail = function(userId) {
	const lastFile = RocketChat.models.UserDataFiles.findLastFileByUser(userId);
	if (lastFile) {
		const userData = RocketChat.models.Users.findOneById(userId);

		if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
			const emailAddress = `${ userData.name } <${ userData.emails[0].address }>`;
			const fromAddress = RocketChat.settings.get('From_Email');
			const subject = TAPi18n.__('UserDataDownload_EmailSubject');

			const download_link = lastFile.url;
			const body = TAPi18n.__('UserDataDownload_EmailBody', { download_link });

			const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

			if (rfcMailPatternWithName.test(emailAddress)) {
				Meteor.defer(function() {
					return Email.send({
						to: emailAddress,
						from: fromAddress,
						subject,
						html: body
					});
				});

				return console.log(`Sending email to ${ emailAddress }`);
			}
		}
	}
};

const makeZipFile = function(exportOperation) {
	const targetFile = path.join(zipFolder, `${ exportOperation.userId }.zip`);
	const output = fs.createWriteStream(targetFile);

	exportOperation.generatedFile = targetFile;

	const archive = archiver('zip');

	output.on('close', () => {
	});

	archive.on('error', (err) => {
		throw err;
	});

	archive.pipe(output);
	archive.directory(exportOperation.exportPath, false);
	archive.finalize();
};

const uploadZipFile = function(exportOperation, callback) {
	const userDataStore = FileUpload.getStore('UserDataFiles');
	const filePath = exportOperation.generatedFile;

	const stat = Meteor.wrapAsync(fs.stat)(filePath);
	const stream = fs.createReadStream(filePath);

	const contentType = 'application/zip';
	const size = stat.size;

	const userId = exportOperation.userId;
	const user = RocketChat.models.Users.findOneById(userId);
	const userDisplayName = user ? user.name : userId;
	const utcDate = new Date().toISOString().split('T')[0];

	const newFileName = encodeURIComponent(`${ utcDate }-${ userDisplayName }.zip`);

	const details = {
		userId,
		type: contentType,
		size,
		name: newFileName
	};

	userDataStore.insert(details, stream, (err) => {
		if (err) {
			throw new Meteor.Error('invalid-file', 'Invalid Zip File', { method: 'cronProcessDownloads.uploadZipFile' });
		} else {
			callback();
		}
	});
};

const generateChannelsFile = function(exportOperation) {
	if (exportOperation.fullExport) {
		const fileName = path.join(exportOperation.exportPath, 'channels.json');
		startFile(fileName, '');

		exportOperation.roomList.forEach((roomData) => {
			const newRoomData = {
				roomId: roomData.roomId,
				roomName: roomData.roomName,
				type: roomData.type
			};

			const messageString = JSON.stringify(newRoomData);
			writeToFile(fileName, `${ messageString }\n`);
		});
	}

	exportOperation.status = 'exporting';
};

const continueExportOperation = function(exportOperation) {
	if (exportOperation.status === 'completed') {
		return;
	}

	if (!exportOperation.roomList) {
		loadUserSubscriptions(exportOperation);
	}

	try {

		if (exportOperation.status === 'exporting-rooms') {
			generateChannelsFile(exportOperation);
		}

		//Run every room on every request, to avoid missing new messages on the rooms that finished first.
		if (exportOperation.status === 'exporting') {
			exportOperation.roomList.forEach((exportOpRoomData) => {
				continueExportingRoom(exportOperation, exportOpRoomData);
			});

			if (isExportComplete(exportOperation)) {
				exportOperation.status = 'downloading';
				return;
			}
		}

		if (exportOperation.status === 'downloading') {
			exportOperation.fileList.forEach((attachmentData) => {
				copyFile(exportOperation, attachmentData);
			});

			if (isDownloadFinished(exportOperation)) {
				exportOperation.status = 'compressing';
				return;
			}
		}

		if (exportOperation.status === 'compressing') {
			makeZipFile(exportOperation);
			exportOperation.status = 'uploading';
			return;
		}

		if (exportOperation.status === 'uploading') {
			uploadZipFile(exportOperation, () => {
				exportOperation.status = 'completed';
				RocketChat.models.ExportOperations.updateOperation(exportOperation);
			});
			return;
		}
	} catch (e) {
		console.error(e);
	}
};

function processDataDownloads() {
	const cursor = RocketChat.models.ExportOperations.findAllPending({limit: 1});
	cursor.forEach((exportOperation) => {
		if (exportOperation.status === 'completed') {
			return;
		}

		continueExportOperation(exportOperation);
		RocketChat.models.ExportOperations.updateOperation(exportOperation);

		if (exportOperation.status === 'completed') {
			sendEmail(exportOperation.userId);
		}
	});
}

Meteor.startup(function() {
	Meteor.defer(function() {
		processDataDownloads();

		SyncedCron.add({
			name: 'Generate download files for user data',
			schedule: (parser) => parser.cron(`*/${ processingFrequency } * * * *`),
			job: processDataDownloads
		});
	});
});
