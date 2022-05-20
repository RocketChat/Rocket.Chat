import { WebApp } from 'meteor/webapp';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { UserDataFiles } from '../../models/server/raw';
import { DataExport } from './DataExport';
import { settings } from '../../settings/server';

WebApp.connectHandlers.use(DataExport.getPath(), async function (req, res, next) {
	const match = /^\/([^\/]+)/.exec(req.url);

	if (!settings.get('UserData_EnableDownload')) {
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');
		res.writeHead(403);
		return res.end(DataExport.getErrorPage(TAPi18n.__('Feature_Disabled'), TAPi18n.__('UserDataDownload_FeatureDisabled')));
	}

	if (match && match[1]) {
		const file = await UserDataFiles.findOneById(match[1]);
		if (file) {
			if (!DataExport.requestCanAccessFiles(req, file.userId)) {
				res.setHeader('Content-Type', 'text/html; charset=UTF-8');
				res.writeHead(403);
				return res.end(DataExport.getErrorPage(TAPi18n.__('403'), TAPi18n.__('UserDataDownload_LoginNeeded')));
			}

			res.setHeader('Content-Security-Policy', "default-src 'none'");
			res.setHeader('Cache-Control', 'max-age=31536000');
			return DataExport.get(file, req, res, next);
		}
	}
	res.writeHead(404);
	res.end();
});
