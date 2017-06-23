import fs from 'fs';
import path from 'path';

function log(...args) {
	console.log('[AVATAR]', ...args);
}

function logError(...args) {
	console.error('[AVATAR]', ...args);
}

RocketChat.Migrations.add({
	version: 97,
	up() {
		log('Migrating avatars. This might take a while.');

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

		const avatarsPath = RocketChat.models.Settings.findOne({_id: 'Accounts_AvatarStorePath'}).value;

		Meteor.setTimeout(function() {
			Meteor.runAsUser('rocket.cat', function() {
				const avatarsFileStore = FileUpload.getStore('Avatars');

				const oldAvatarGridFS = new RocketChatFile.GridFS({
					name: 'avatars'
				});

				const users = RocketChat.models.Users.find({avatarOrigin: {$in: avatarOrigins}}, {avatarOrigin: 1, username: 1});

				log('Total users to migrate avatars ->', users.count());

				let current = 0;

				users.forEach((user) => {
					const id = `${ user.username }.jpg`;
					const gridFSAvatar = oldAvatarGridFS.getFileWithReadStream(id);

					log('Migrating ', current++, 'of', users.count());

					if (gridFSAvatar) {
						const details = {
							userId: user._id,
							type: gridFSAvatar.contentType,
							size: gridFSAvatar.length,
							name: user.username
						};

						avatarsFileStore.insert(details, gridFSAvatar.readStream, (err) => {
							if (err) {
								logError({err});
							} else {
								oldAvatarGridFS.deleteFile(id);
							}
						});
					} else if (avatarsPath && avatarsPath.trim()) {
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
										logError({err});
									} else {
										fs.unlinkSync(filePath);
									}
								});
							}
						} catch (e) {
							log('Error migrating old avatars', e);
						}
					}
				});
			});
		}, 1000);

		const avatarsFiles = new Mongo.Collection('avatars.files');
		const avatarsChunks = new Mongo.Collection('avatars.chunks');
		avatarsFiles.rawCollection().drop();
		avatarsChunks.rawCollection().drop();
		RocketChat.models.Settings.remove({_id: 'Accounts_AvatarStoreType'});
		RocketChat.models.Settings.remove({_id: 'Accounts_AvatarStorePath'});
	}
});
