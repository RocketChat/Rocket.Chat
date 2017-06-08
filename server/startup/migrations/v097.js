import fs from 'fs';
import path from 'path';

RocketChat.Migrations.add({
	version: 97,
	up() {
		const query = {
			$or: [{
				's3.path': {
					$exists: true
				}
			}, {
				'googleCloudStorage.path': {
					$exists: true
				}
			}]
		};

		RocketChat.models.Uploads.find(query).forEach((record) => {
			if (record.s3) {
				RocketChat.models.Uploads.model.direct.update({_id: record._id}, {
					$set: {
						'store': 'AmazonS3:Uploads',
						AmazonS3: {
							path: record.s3.path + record._id
						}
					},
					$unset: {
						s3: 1
					}
				}, {multi: true});
			} else {
				RocketChat.models.Uploads.model.direct.update({_id: record._id}, {
					$set: {
						store: 'GoogleCloudStorage:Uploads',
						GoogleStorage: {
							path: record.googleCloudStorage.path + record._id
						}
					},
					$unset: {
						googleCloudStorage: 1
					}
				}, {multi: true});
			}
		});

		RocketChat.models.Uploads.model.direct.update({
			store: 'fileSystem'
		}, {
			$set: {
				store: 'FileSystem:Uploads'
			}
		}, {
			multi: true
		});
		RocketChat.models.Uploads.model.direct.update({
			store: 'rocketchat_uploads'
		}, {
			$set: {
				store: 'GridFS:Uploads'
			}
		}, {
			multi: true
		});

		const avatarOrigins = [
			'upload',
			'gravatar',
			'facebook',
			'twitter',
			'github',
			'google',
			'url',
			'gitlab',
			'linkedin'
		];

		Meteor.setTimeout(function() {
			Meteor.runAsUser('rocket.cat', function() {
				const avatarsFileStore = FileUpload.getStore('Avatars');

				const oldAvatarGridFS = new RocketChatFile.GridFS({
					name: 'avatars'
				});

				RocketChat.models.Users.find({avatarOrigin: {$in: avatarOrigins}}, {avatarOrigin: 1, username: 1}).forEach((user) => {
					const id = `${ user.username }.jpg`;
					const gridFSAvatar = oldAvatarGridFS.getFileWithReadStream(id);

					if (gridFSAvatar) {
						const details = {
							userId: user._id,
							type: gridFSAvatar.contentType,
							size: gridFSAvatar.length,
							name: user.username
						};

						avatarsFileStore.insert(details, gridFSAvatar.readStream, (err) => {
							if (err) {
								console.log({err});
							} else {
								oldAvatarGridFS.deleteFile(id);
							}
						});
					} else {
						const avatarsPath = RocketChat.models.Settings.findOne({_id: 'Accounts_AvatarStorePath'}).value;
						if (avatarsPath && avatarsPath.trim()) {
							const filePath = path.join(avatarsPath, id);
							try {
								const stat = fs.statSync(filePath);
								if (stat && stat.isFile()) {
									const rs = fs.createReadStream(filePath);
									const details = {
										userId: user._id,
										type: 'image/jpeg',
										size: stat.size
									};

									avatarsFileStore.insert(details, rs, (err) => {
										if (err) {
											console.log({err});
										} else {
											fs.unlinkSync(filePath);
										}
									});
								}
							} catch (e) {
								console.log('Error migrating old avatars', e);
							}
						}
					}
				});

				RocketChat.models.Settings.remove({_id: 'Accounts_AvatarStoreType'});
				RocketChat.models.Settings.remove({_id: 'Accounts_AvatarStorePath'});

				const avatarsFiles = new Mongo.Collection('avatars.files');
				const avatarsChunks = new Mongo.Collection('avatars.chunks');
				avatarsFiles.rawCollection().drop();
				avatarsChunks.rawCollection().drop();
			});
		}, 1000);
	}
});
