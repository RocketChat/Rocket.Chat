import fs from 'fs';
import path from 'path';

function log(...args) {
	console.log('[AVATAR]', ...args);
}

function logError(...args) {
	console.error('[AVATAR]', ...args);
}

function insertAvatar({ details, avatarsFileStore, stream, callback = () => {} }) {
	return new Promise((resolve) => {
		Meteor.defer(() => {
			Meteor.runAsUser('rocket.cat', () => {
				avatarsFileStore.insert(details, stream, (err) => {
					if (err) {
						logError({err});
						resolve();
					} else {
						Meteor.setTimeout(() => {
							callback();
						}, 200);
					}
					resolve();
				});
			});
		});
	});
}

function batch(arr, limit, fn) {
	if (!arr.length) {
		return Promise.resolve();
	}
	return Promise.all(arr.splice(0, limit).map((item) => {
		return fn(item);
	})).then(() => { return batch(arr, limit, fn); });
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
		const avatarStoreType = RocketChat.models.Settings.findOne({_id: 'Accounts_AvatarStoreType'}).value;

		Meteor.setTimeout(function() {
			const avatarsFileStore = FileUpload.getStore('Avatars');

			const oldAvatarGridFS = new RocketChatFile.GridFS({
				name: 'avatars'
			});

			const users = RocketChat.models.Users.find({avatarOrigin: {$in: avatarOrigins}}, {avatarOrigin: 1, username: 1}).fetch();

			const usersTotal = users.length;

			log('Total users to migrate avatars ->', usersTotal);

			let current = 0;

			batch(users, 300, (user) => {
				const id = `${ user.username }.jpg`;

				const gridFSAvatar = oldAvatarGridFS.getFileWithReadStream(id);

				log('Migrating', ++current, 'of', usersTotal);

				if (gridFSAvatar) {
					const details = {
						userId: user._id,
						type: gridFSAvatar.contentType,
						size: gridFSAvatar.length
					};

					return insertAvatar({
						details,
						avatarsFileStore,
						stream: gridFSAvatar.readStream,
						callback() {
							oldAvatarGridFS.deleteFile(id);
						}
					});
				}
				if (avatarStoreType === 'FileSystem' && avatarsPath && avatarsPath.trim()) {
					try {
						const filePath = path.join(avatarsPath, id);
						const stat = fs.statSync(filePath);
						if (stat && stat.isFile()) {
							const details = {
								userId: user._id,
								type: 'image/jpeg',
								size: stat.size
							};
							return insertAvatar({
								details,
								avatarsFileStore,
								stream: fs.createReadStream(filePath),
								callback() {
									fs.unlinkSync(filePath);
								}
							});
						}
					} catch (e) {
						logError('Error migrating old avatar', e);
						return Promise.resolve();
					}
				}
			}).then(() => {
				const avatarsFiles = new Mongo.Collection('avatars.files');
				const avatarsChunks = new Mongo.Collection('avatars.chunks');
				avatarsFiles.rawCollection().drop();
				avatarsChunks.rawCollection().drop();
			});
		}, 1000);
		RocketChat.models.Settings.remove({_id: 'Accounts_AvatarStoreType'});
		RocketChat.models.Settings.remove({_id: 'Accounts_AvatarStorePath'});
	}
});
