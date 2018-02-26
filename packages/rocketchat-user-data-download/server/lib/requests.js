/* globals FileUpload, WebApp */

import fs from 'fs';

WebApp.connectHandlers.use(`${ __meteor_runtime_config__.ROOT_URL_PATH_PREFIX }/user-data-download/`, function(req, res) {
	const match = /^\/(.*)\/?/.exec(req.url);
	if (match[1]) {
		const userId = match[1];
		const user = RocketChat.models.Users.findOneById(userId);
		const userName = user ? user.name : userId;

		const operation = RocketChat.models.ExportOperations.findLastOperationByUser(userId);

		if (operation && operation.status === 'completed') {
			if (operation.generatedFile !== null) {

				if (!Meteor.settings.public.sandstorm && !FileUpload.requestCanAccessFiles(req)) {
					res.writeHead(403);
					return res.end();
				}

				const filePath = operation.generatedFile;

				if (!filePath) {
					res.writeHead(404);
					return res.end();
				}

				try {
					const stat = Meteor.wrapAsync(fs.stat)(filePath);

					if (stat && stat.isFile()) {
						const utcDate = stat.mtime.toISOString().split('T')[0];
						const newFileName = encodeURIComponent(`${ utcDate }-${ userName }`);

						res.setHeader('Content-Security-Policy', 'default-src \'none\'');
						res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${ newFileName }.zip`);
						res.setHeader('Last-Modified', stat.mtime.toUTCString());

						res.setHeader('Content-Type', 'application/zip');
						res.setHeader('Content-Length', stat.size);

						const stream = fs.createReadStream(filePath);
						stream.on('close', () => {
							res.end();
						});
						stream.pipe(res);
					}

					return;
				} catch (e) {
					res.writeHead(404);
					res.end();
					return;
				}
			}
		}
	}

	res.writeHead(404);
	res.end();
});
