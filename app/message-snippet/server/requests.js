import { WebApp } from 'meteor/webapp';
import { Cookies } from 'meteor/ostrio:cookies';

import { Users, Rooms, Messages } from '../../models';

WebApp.connectHandlers.use('/snippet/download', function (req, res) {
	let rawCookies;
	let token;
	let uid;
	const cookie = new Cookies();

	if (req.headers && req.headers.cookie !== null) {
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

	const user = Users.findOneByIdAndLoginToken(uid, token);

	if (!(uid && token && user)) {
		res.writeHead(403);
		res.end();
		return false;
	}
	const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match[1]) {
		const snippet = Messages.findOne({
			_id: match[1],
			snippeted: true,
		});
		const room = Rooms.findOne({ _id: snippet.rid, usernames: { $in: [user.username] } });
		if (room === undefined) {
			res.writeHead(403);
			res.end();
			return false;
		}

		res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(snippet.snippetName)}`);
		res.setHeader('Content-Type', 'application/octet-stream');

		// Removing the ``` contained in the msg.
		const snippetContent = snippet.msg.substr(3, snippet.msg.length - 6);
		res.setHeader('Content-Length', snippetContent.length);
		res.write(snippetContent);
		res.end();
		return;
	}

	res.writeHead(404);
	res.end();
});
