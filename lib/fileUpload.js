/* globals UploadFS, FileUpload */
import { Cookies } from 'meteor/ostrio:cookies';

if (UploadFS) {
	const initFileStore = function() {
		const cookie = new Cookies();
		if (Meteor.isClient) {
			document.cookie = `rc_uid=${ escape(Meteor.userId()) }; path=/`;
			document.cookie = `rc_token=${ escape(Accounts._storedLoginToken()) }; path=/`;
		}

		Meteor.fileStore = new UploadFS.store.GridFS({
			collection: RocketChat.models.Uploads.model,
			name: 'rocketchat_uploads',
			collectionName: 'rocketchat_uploads',
			filter: new UploadFS.Filter({
				onCheck: FileUpload.validateFileUpload
			}),
			transformWrite(readStream, writeStream, fileId, file) {
				if (RocketChatFile.enabled === false || !/^image\/.+/.test(file.type)) {
					return readStream.pipe(writeStream);
				}

				let stream = undefined;

				const identify = function(err, data) {
					if (err) {
						return stream.pipe(writeStream);
					}

					file.identify = {
						format: data.format,
						size: data.size
					};

					if (data.Orientation && !['', 'Unknown', 'Undefined'].includes(data.Orientation)) {
						RocketChatFile.gm(stream).autoOrient().stream().pipe(writeStream);
					} else {
						stream.pipe(writeStream);
					}
				};

				stream = RocketChatFile.gm(readStream).identify(identify).stream();
			},

			onRead(fileId, file, req, res) {
				if (RocketChat.settings.get('FileUpload_ProtectFiles')) {
					let uid;
					let token;

					if (req && req.headers && req.headers.cookie) {
						const rawCookies = req.headers.cookie;

						if (rawCookies) {
							uid = cookie.get('rc_uid', rawCookies) ;
							token = cookie.get('rc_token', rawCookies);
						}
					}

					if (!uid) {
						uid = req.query.rc_uid;
						token = req.query.rc_token;
					}

					if (!uid || !token || !RocketChat.models.Users.findOneByIdAndLoginToken(uid, token)) {
						res.writeHead(403);
						return false;
					}
				}

				res.setHeader('content-disposition', `attachment; filename="${ encodeURIComponent(file.name) }"`);
				return true;
			}
		});
	};

	Meteor.startup(function() {
		if (Meteor.isServer) {
			initFileStore();
		} else {
			Tracker.autorun(function(c) {
				if (Meteor.userId() && RocketChat.settings.cachedCollection.ready.get()) {
					initFileStore();
					c.stop();
				}
			});
		}
	});
}
