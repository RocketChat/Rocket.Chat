import fs from 'fs';
import path from 'path';

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

const continueExportingRoom = function(exportOperation, exportOpRoomData) {
	createDir(exportOperation.exportPath);
	const filePath = path.join(exportOperation.exportPath, exportOpRoomData.targetFile);

	if (exportOpRoomData.status === 'pending') {
		exportOpRoomData.status = 'exporting';
		startFile(filePath, '');
	}

	const limit = 50;
	const skip = exportOpRoomData.exportedCount;

	const cursor = RocketChat.models.Messages.findByRoomId(exportOpRoomData.roomId, { limit, skip });
	const count = cursor.count();

	cursor.forEach((msg) => {
		const attachments = [];

		if (msg.attachments) {
			msg.attachments.forEach((attachment) => {
				attachments.push({
					type : attachment.type,
					title : attachment.title,
					url : attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url
				});
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

const continueExportOperation = function(exportOperation) {
	if (exportOperation.status === 'completed') {
		return true;
	}

	if (!exportOperation.roomList) {
		loadUserSubscriptions(exportOperation);
	}

	let nextRoom = false;
	exportOperation.roomList.some((exportOpRoomData) => {
		if (exportOpRoomData.status === 'completed') {
			return false;
		}

		nextRoom = exportOpRoomData;
		return true;
	});

	if (nextRoom) {
		continueExportingRoom(exportOperation, nextRoom);
	}

	if (isOperationFinished(exportOperation)) {
		exportOperation.status = 'completed';
		return true;
	}

	return false;
};

Meteor.methods({
	processDataDownloads() {
		const cursor = RocketChat.models.ExportOperations.findAllPending({limit: 1});
		cursor.forEach((exportOperation) => {
			continueExportOperation(exportOperation);
			RocketChat.models.ExportOperations.updateOperation(exportOperation);
		});
	}
});
