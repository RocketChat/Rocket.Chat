import { requestCanAccessFiles } from '../lib/LivechatRequests';

/* globals FileUpload, WebApp */

WebApp.connectHandlers.use('/livechat-file-upload/', function(req, res, next) {

	const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (!match[1]) {
		res.writeHead(404);
		return res.end();
	}

	const file = RocketChat.models.Uploads.findOneById(match[1]);

	if (!file) {
		res.writeHead(404);
		res.end();
	}

	if (!Meteor.settings.public.sandstorm && !requestCanAccessFiles(req)) {
		res.writeHead(403);
		return res.end();
	}

	res.setHeader('Content-Security-Policy', 'default-src \'none\'');
	return FileUpload.get(file, req, res, next);
});
