/* globals FileUpload, WebApp, Cookies */
let protectedFiles;

RocketChat.settings.get('FileUpload_ProtectFiles', function(key, value) {
	protectedFiles = value;
});

WebApp.connectHandlers.use('/file-upload/', function(req, res, next) {
	const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match[1]) {
		const file = RocketChat.models.Uploads.findOneById(match[1]);

		if (file) {
			if (!Meteor.settings.public.sandstorm && protectedFiles) {
				let rawCookies, ref, token, uid;
				const cookie = new Cookies();

				if ((typeof req !== 'undefined' && req !== null ? (ref = req.headers) != null ? ref.cookie : void 0 : void 0) != null) {
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
