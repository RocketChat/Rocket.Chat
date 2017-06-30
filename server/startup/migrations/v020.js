RocketChat.Migrations.add({
	version: 20,
	up() {
		/*
		 * Migrate existing `rocketchat_uploads` documents to include the room Id
		 * where the file was uploaded to. The room Id is retrieved from the message
		 * document created after the file upload.
		 */

		// list of channel messages which were created after uploading a file
		const msgQuery = {
			rid: {
				$exists: true
			},
			'file._id': {
				$exists: true
			}
		};

		const msgOptions = {
			fields: {
				_id: 1,
				rid: 1,
				'file._id': 1
			}
		};

		const cursorFileMessages = RocketChat.models.Messages.find(msgQuery, msgOptions);
		if (!cursorFileMessages.count()) {
			return;
		}

		cursorFileMessages.fetch().forEach((msg) => {
			return RocketChat.models.Uploads.update({
				_id: msg.file && msg.file._id
			}, {
				$set: {
					rid: msg.rid
				}
			}, {
				$multi: true
			});
		});

		return console.log('Updated rocketchat_uploads documents to include the room Id in which they were sent.');
	}
});
