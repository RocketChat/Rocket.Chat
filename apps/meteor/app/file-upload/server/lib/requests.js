import { WebApp } from 'meteor/webapp';

import { FileUpload } from './FileUpload';
import { Uploads } from '../../../models/server/raw';

WebApp.connectHandlers.use(FileUpload.getPath(), async function (req, res, next) {
	const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match && match[1]) {
		const file = await Uploads.findOneById(match[1]);

		if (file) {
			if (!FileUpload.requestCanAccessFiles(req)) {
				res.writeHead(403);
				return res.end();
			}

			res.setHeader('Content-Security-Policy', "default-src 'none'");
			res.setHeader('Cache-Control', 'max-age=31536000');
			return FileUpload.get(file, req, res, next);
		}
	}

	res.writeHead(404);
	res.end();
});
