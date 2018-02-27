/* globals SyncedCron */

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

let zipFolder = '~/zipFiles';
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

	const cursor = RocketChat.models.Subscriptions.findByUserId(exportOperation.userId);
	cursor.forEach((subscription) => {
		const roomId = subscription._room._id;
		const roomData = subscription._room;
		const roomName = roomData.name ? roomData.name : roomId;

		const fileName = `${ roomName }.json`;

		exportOperation.roomList.push({
			roomId,
			roomName,
			exportedCount: 0,
			status: 'pending',
			targetFile: fileName
		});
	});

	exportOperation.status = 'exporting';
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
		audio_type: attachment.audio_type
	};

	return attachmentData;
};

const addToFileList = function(exportOperation, attachment) {
	const url = attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url || attachment.message_link;
	if (!url) {
		return;
	}

	const attachmentData = {
		url,
		copied: false
	};

	exportOperation.fileList.push(attachmentData);
};

const getMessageData = function(msg, exportOperation) {
	const attachments = [];

	if (msg.attachments) {
		msg.attachments.forEach((attachment) => {
			const attachmentData = getAttachmentData(attachment);

			attachments.push(attachmentData);
			addToFileList(exportOperation, attachment);
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
	if (attachmentData.copied) {
		return;
	}

	//If it is an URL, just mark as downloaded
	const urlMatch = /\:\/\//.exec(attachmentData.url);
	if (urlMatch && urlMatch.length > 0) {
		attachmentData.copied = true;
		return;
	}

	const match = /^\/([^\/]+)\/([^\/]+)\/(.*)/.exec(attachmentData.url);

	if (match && match[2]) {
		const file = RocketChat.models.Uploads.findOneById(match[2]);

		if (file) {
			if (FileUpload.copy(file, exportOperation.assetsPath)) {
				attachmentData.copied = true;
			}
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
		const messageString = JSON.stringify(messageObject);

		writeToFile(filePath, `${ messageString }\n`);
		exportOpRoomData.exportedCount++;
	});

	if (count <= exportOpRoomData.exportedCount) {
		exportOpRoomData.status = 'completed';
		return true;
	}

	return false;
};

const isOperationFinished = function(exportOperation) {
	const incomplete = exportOperation.roomList.some((exportOpRoomData) => {
		return exportOpRoomData.status !== 'completed';
	});

	return !incomplete;
};

const isDownloadFinished = function(exportOperation) {
	const anyDownloadPending = exportOperation.fileList.some((fileData) => {
		return !fileData.copied;
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
		userId: userId,
		type: contentType,
		size,
		name: newFileName
	};

	userDataStore.insert(details, stream, (err) => {
		if (err) {
			logError({err});
			resolve();
		} else {
			callback();
		}
	});
};

const continueExportOperation = function(exportOperation) {
	if (exportOperation.status === 'completed') {
		return;
	}

	if (!exportOperation.roomList) {
		loadUserSubscriptions(exportOperation);
	}

	try {
		//Run every room on every request, to avoid missing new messages on the rooms that finished first.
		if (exportOperation.status == 'exporting') {
			exportOperation.roomList.forEach((exportOpRoomData) => {
				continueExportingRoom(exportOperation, exportOpRoomData);
			});
			
			if (isOperationFinished(exportOperation)) {
				exportOperation.status = 'downloading';
				return;
			}
		}

		if (exportOperation.status == 'downloading') {
			exportOperation.fileList.forEach((attachmentData) => {
				copyFile(exportOperation, attachmentData);
			});
			
			if (isDownloadFinished(exportOperation)) {
				exportOperation.status = 'compressing';
				return;
			}
		}

		if (exportOperation.status == 'compressing') {
			makeZipFile(exportOperation);
			exportOperation.status = 'uploading';
			return;
		}

		if (exportOperation.status == 'uploading') {
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
