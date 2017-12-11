/* globals FileUpload, WebApp */
import { Cookies } from 'meteor/ostrio:cookies';

let protectedFiles;

RocketChat.settings.get('FileUpload_ProtectFiles', function(key, value) {
	protectedFiles = value;
});

WebApp.connectHandlers.use(`${ __meteor_runtime_config__.ROOT_URL_PATH_PREFIX }/file-upload/`,	function(req, res, next) {

	const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match[1]) {
		const file = RocketChat.models.Uploads.findOneById(match[1]);

		if (file) {
			if (!Meteor.settings.public.sandstorm && protectedFiles) {
				let rawCookies;
				let token;
				let uid;
				const cookie = new Cookies();

				if (req.headers && req.headers.cookie != null) {
					rawCookies = req.headers.cookie;
				}

				if (rawCookies != null) {
					uid = cookie.get('rc_uid', rawCookies);
				}

				if (rawCookies != null) {
					token = cookie.get('rc_token', rawCookies);
				}

				if (uid == null) {
					uid = req.query.rc_uid;
					token = req.query.rc_token;
				}

				if (!(uid && token && RocketChat.models.Users.findOneByIdAndLoginToken(uid, token))) {
					res.writeHead(403);
					res.end();
					return false;
				}
			}

			res.setHeader('Content-Security-Policy', 'default-src \'none\'');

			return FileUpload.get(file, req, res, next);
		}
	}

	res.writeHead(404);
	res.end();
	return;
});
