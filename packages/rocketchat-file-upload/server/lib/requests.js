/* globals FileUpload, WebApp, Cookies */
var protectedFiles;

RocketChat.settings.get('FileUpload_ProtectFiles', function(key, value) {
	protectedFiles = value;
});

WebApp.connectHandlers.use('/file-upload/', function(req, res, next) {
	var file;

	var match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match[1]) {
		file = RocketChat.models.Uploads.findOneById(match[1]);

		if (file) {
			if (!Meteor.settings.public.sandstorm && protectedFiles) {
				var cookie, rawCookies, ref, token, uid;
				cookie = new Cookies();

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

			return FileUpload.get(file, req, res, next);
		}
	}

	res.writeHead(404);
	res.end();
	return;
});
