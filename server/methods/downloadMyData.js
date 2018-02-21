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

Meteor.methods({
	downloadMyData() {
		const currentUserData = Meteor.user();
		const subscriptions = RocketChat.models.Subscriptions.findByUserId(currentUserData._id).fetch();

		subscriptions.forEach((subscription) => {
			const roomId = subscription._room._id;
			const roomData = subscription._room;
			const roomName = roomData.name ? roomData.name : roomId;

			const folderName = path.join('/tmp/', currentUserData._id);

			createDir(folderName);
			const fileName = `${ roomName }.json`;
			const filePath = path.join(folderName, fileName);

			startFile(filePath, '[');

			let loadedAllMessages = false;
			let needsComma = false;
			const limit = 20;
			let skip = 0;

			while (!loadedAllMessages) {
				const messages = RocketChat.models.Messages.findByRoomId(roomId, { limit, skip }).fetch();
				if (messages.length === 0) {
					loadedAllMessages = true;
					break;
				}

				skip += limit;

				messages.forEach((msg) => {
					const attachments = [];

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
					needsComma = true;
				});
			}

			writeToFile(filePath, ']');
		});
	}

});
