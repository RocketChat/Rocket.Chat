RocketChat.Migrations.add({
	version: 15,
	up() {
		console.log('Starting file migration');
		const oldFilesCollection = new Mongo.Collection('cfs.Files.filerecord');
		const oldGridFSCollection = new Mongo.Collection('cfs_gridfs.files.files');
		const oldChunkCollection = new Mongo.Collection('cfs_gridfs.files.chunks');
		const newFilesCollection = RocketChat.models.Uploads;
		const newGridFSCollection = new Mongo.Collection('rocketchat_uploads.files');
		const newChunkCollection = new Mongo.Collection('rocketchat_uploads.chunks');

		oldFilesCollection.find({
			'copies.files.key': {
				$exists: true
			}
		}).forEach((cfsRecord) => {
			const nameParts = cfsRecord.original.name && cfsRecord.original.name.split('.');
			let extension = '';
			let url = `ufs/rocketchat_uploads/${ cfsRecord._id }`;

			console.log('migrating file', url);

			if (nameParts && nameParts.length > 1) {
				extension = nameParts.pop();
				url = `${ url }.${ extension }`;
			}

			const record = {
				_id: cfsRecord._id,
				name: cfsRecord.original.name || '',
				size: cfsRecord.original.size,
				type: cfsRecord.original.type,
				complete: true,
				uploading: false,
				store: 'rocketchat_uploads',
				extension,
				userId: cfsRecord.userId,
				uploadedAt: cfsRecord.updatedAt,
				url: Meteor.absoluteUrl() + url
			};

			newFilesCollection.insert(record);

			const oldGridFsFile = oldGridFSCollection.findOne({
				_id: new Mongo.Collection.ObjectID(cfsRecord.copies.files.key)
			});

			newGridFSCollection.insert({
				_id: cfsRecord._id,
				filename: cfsRecord._id,
				contentType: oldGridFsFile.contentType,
				length: oldGridFsFile.length,
				chunkSize: oldGridFsFile.chunkSize,
				uploadDate: oldGridFsFile.uploadDate,
				aliases: null,
				metadata: null,
				md5: oldGridFsFile.md5
			});

			oldChunkCollection.find({
				files_id: new Mongo.Collection.ObjectID(cfsRecord.copies.files.key)
			}).forEach((oldChunk) => {
				newChunkCollection.insert({
					_id: oldChunk._id,
					files_id: cfsRecord._id,
					n: oldChunk.n,
					data: oldChunk.data
				});
			});

			RocketChat.models.Messages.find({
				$or: [{
					'urls.url': `https://demo.rocket.chat/cfs/files/Files/${ cfsRecord._id }`
				}, {
					'urls.url': `https://rocket.chat/cfs/files/Files/${ cfsRecord._id }`
				}]
			}).forEach((message) => {
				for (const urlsItem of message.urls) {
					if (urlsItem.url === (`https://demo.rocket.chat/cfs/files/Files/${ cfsRecord._id }`) || urlsItem.url === (`https://rocket.chat/cfs/files/Files/${ cfsRecord._id }`)) {
						urlsItem.url = Meteor.absoluteUrl() + url;
						if (urlsItem.parsedUrl && urlsItem.parsedUrl.pathname) {
							urlsItem.parsedUrl.pathname = `/${ url }`;
						}
						message.msg = message.msg.replace(`https://demo.rocket.chat/cfs/files/Files/${ cfsRecord._id }`, Meteor.absoluteUrl() + url);
						message.msg = message.msg.replace(`https://rocket.chat/cfs/files/Files/${ cfsRecord._id }`, Meteor.absoluteUrl() + url);
					}
				}

				RocketChat.models.Messages.update({_id: message._id}, {
					$set: {
						urls: message.urls,
						msg: message.msg
					}
				});
			});

			oldFilesCollection.remove({_id: cfsRecord._id});
			oldGridFSCollection.remove({_id: oldGridFsFile._id});
			oldChunkCollection.remove({files_id: new Mongo.Collection.ObjectID(cfsRecord.copies.files.key)});
		});

		return console.log('End of file migration');
	}
});
