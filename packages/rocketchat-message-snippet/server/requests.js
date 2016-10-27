/* global Cookies */
WebApp.connectHandlers.use('/snippet/download', function(req, res) {
	var cookie, rawCookies, ref, token, uid;
	cookie = new Cookies();

	if ((typeof req !== 'undefined' && req !== null ? (ref = req.headers) !== null ? ref.cookie : void 0 : void 0) !== null) {
		rawCookies = req.headers.cookie;
	}

	if (rawCookies !== null) {
		uid = cookie.get('rc_uid', rawCookies);
	}

	if (rawCookies !== null) {
		token = cookie.get('rc_token', rawCookies);
	}

	if (uid === null) {
		uid = req.query.rc_uid;
		token = req.query.rc_token;
	}

	let user = RocketChat.models.Users.findOneByIdAndLoginToken(uid, token);

	if (!(uid && token && user)) {
		res.writeHead(403);
		res.end();
		return false;
	}
	var match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match[1]) {
		let snippet = RocketChat.models.Messages.findOne(
			{
				'_id': match[1],
				'snippeted': true
			}
		);
		let room = RocketChat.models.Rooms.findOne({ '_id': snippet.rid, 'usernames': { '$in': [user.username] }});
		if (room === undefined) {
			res.writeHead(403);
			res.end();
			return false;
		}

		res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(snippet.snippetName)}`);
		res.setHeader('Content-Type', 'application/octet-stream');

		// Removing the ``` contained in the msg.
		let snippetContent = snippet.msg.substr(3, snippet.msg.length - 6);
		res.setHeader('Content-Length', snippetContent.length);
		res.write(snippetContent);
		res.end();
		return;
	}

	res.writeHead(404);
	res.end();
	return;
});
