import { WebApp } from 'meteor/webapp';

import { UserDataFiles } from '../../models';
import { DataExport } from './DataExport';
import { settings } from '../../settings/server';


WebApp.connectHandlers.use(DataExport.getPath(), function(req, res, next) {
	const match = /^\/([^\/]+)/.exec(req.url);

	if (!settings.get('UserData_EnableDownload')) {
		res.writeHead(403);
		return res.end('Sorry, user data exports are not enabled on this server!');
	}

	if (match && match[1]) {
		const file = UserDataFiles.findOneById(match[1]);
		if (file) {
			if (!DataExport.requestCanAccessFiles(req, file.userId)) {
				res.writeHead(403);
				// TODO: prettify error
				return res.end('You need to log into your Rocket.Chat account to download this data export.');
			}

			res.setHeader('Content-Security-Policy', 'default-src \'none\'');
			res.setHeader('Cache-Control', 'max-age=31536000');
			return DataExport.get(file, req, res, next);
		}
	}
	res.writeHead(404);
	res.end();
});
