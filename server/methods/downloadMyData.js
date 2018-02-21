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

	const subscriptions = RocketChat.models.Subscriptions.findByUserId(exportOperation.userId).fetch();
	subscriptions.forEach((subscription) => {
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
};

const continueExportingRoom = function(exportOperation, exportOpRoomData) {
	const filePath = path.join(exportOperation.exportPath, exportOpRoomData.targetFile);

	if (exportOpRoomData.status == 'pending') {
		exportOpRoomData.status = 'exporting';
		startFile(filePath, '[');
	}

	const limit = 20;
	let skip = exportOpRoomData.exportedCount;

	const messages = RocketChat.models.Messages.findByRoomId(exportOpRoomData.roomId, { limit, skip }).fetch();
	if (messages.length === 0) {
		writeToFile(filePath, ']');
		exportOpRoomData.status = 'completed';
		return;
	}

	messages.forEach((msg) => {
		const attachments = [];
		const needsComma = exportOpRoomData.exportedCount > 0;

		if (msg.attachments) {
			msg.attachments.forEach((attachment) => {
				attachments.push({
					type : attachment.type,
					title : attachment.title,
					url : attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url,
				});
			});
		}

		const messageObject = {
			msg: msg.msg,
			username: msg.u.username
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

		let messageString = JSON.stringify(messageObject);
		if (needsComma) {
			messageString = `,\n${ messageString }`;
		}

		writeToFile(filePath, messageString);
		exportOpRoomData.exportedCount++;
	});

};

const continueExportOperation = function(exportOperation) {
	if (exportOperation.status == 'completed') {
		return true;
	}

	if (!exportOperation.roomList) {
		loadUserSubscriptions(exportOperation);
	}

	let nextRoom = false;
	exportOperation.roomList.forEach((exportOpRoomData) => {
		if (exportOpRoomData.status == 'completed') {
			return;
		}

		nextRoom = exportOpRoomData;
		return false;
	});

	if (nextRoom) {
		continueExportingRoom(exportOperation, nextRoom);
		return false;
	}

	exportOperation.status = 'completed';
	return true;
};

Meteor.methods({
	downloadMyData() {
		const currentUserData = Meteor.user();

		const folderName = path.join('/tmp/', currentUserData._id);
		const exportOperation = {
			userId : currentUserData._id,
			roomList: null,
			status: 'pending',
			exportPath: folderName
		};

		while (exportOperation.status != 'completed') {
			continueExportOperation(exportOperation);
		}
	}

});
