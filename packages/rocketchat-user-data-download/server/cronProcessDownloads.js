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

	const anyDownloadPending = exportOperation.fileList.some((fileData) => {
		return !fileData.copied;
	});

	return !incomplete && !anyDownloadPending;
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

const continueExportOperation = function(exportOperation) {
	if (exportOperation.status === 'completed') {
		return true;
	}

	if (!exportOperation.roomList) {
		loadUserSubscriptions(exportOperation);
	}

	try {
		//Run every room on every request, to avoid missing new messages on the rooms that finished first.
		exportOperation.roomList.forEach((exportOpRoomData) => {
			continueExportingRoom(exportOperation, exportOpRoomData);
		});

		exportOperation.fileList.forEach((attachmentData) => {
			copyFile(exportOperation, attachmentData);
		});
	} catch (e) {
		console.error(e);
		return false;
	}

	if (isOperationFinished(exportOperation)) {
		makeZipFile(exportOperation);
		exportOperation.status = 'completed';
		return true;
	}

	return false;
};

function processDataDownloads() {
	const cursor = RocketChat.models.ExportOperations.findAllPending({limit: 1});
	cursor.forEach((exportOperation) => {
		continueExportOperation(exportOperation);
		RocketChat.models.ExportOperations.updateOperation(exportOperation);
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
