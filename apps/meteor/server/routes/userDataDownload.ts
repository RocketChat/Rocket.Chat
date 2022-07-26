import { ServerResponse } from 'http';

import { WebApp } from 'meteor/webapp';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { UserDataFiles } from '@rocket.chat/models';
import type { IIncomingMessage, IUser } from '@rocket.chat/core-typings';
import { Cookies } from 'meteor/ostrio:cookies';

import { FileUpload } from '../../app/file-upload/server';
import { getPath } from '../lib/dataExport/getPath';
import { settings } from '../../app/settings/server';
import { getURL } from '../../app/utils/server';
import Users from '../../app/models/server/models/Users';

const getErrorPage = (errorType: string, errorDescription: string): string => {
	let errorHtml = Assets.getText('errors/error_template.html') ?? ''; // @todo server-side rendering?
	errorHtml = errorHtml.replace('$ERROR_TYPE$', errorType);
	errorHtml = errorHtml.replace('$ERROR_DESCRIPTION$', errorDescription);
	errorHtml = errorHtml.replace('$SERVER_URL$', getURL('/', { full: true, cdn: false }));
	return errorHtml;
};

const cookie = new Cookies();

const requestCanAccessFiles = ({ headers = {}, query = {} }: IIncomingMessage, userId?: IUser['_id']) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	let { rc_uid, rc_token } = query;

	if (!rc_uid && headers.cookie) {
		rc_uid = cookie.get('rc_uid', headers.cookie);
		rc_token = cookie.get('rc_token', headers.cookie);
	}

	const options = { fields: { _id: 1 } };

	if (rc_uid && rc_token && rc_uid === userId) {
		return !!Users.findOneByIdAndLoginToken(rc_uid, rc_token, options);
	}

	if (headers['x-user-id'] && headers['x-auth-token'] && headers['x-user-id'] === userId) {
		return !!Users.findOneByIdAndLoginToken(headers['x-user-id'], headers['x-auth-token'], options);
	}

	return false;
};

const userDataStore = FileUpload.getStore('UserDataFiles');
const get = (file: any, req: IIncomingMessage, res: ServerResponse, next: () => void) => {
	if (userDataStore?.get) {
		return userDataStore.get(file, req, res, next);
	}

	res.writeHead(404);
	res.end();
};

WebApp.connectHandlers.use(getPath(), async (req, res, next) => {
	const downloadEnabled = settings.get<boolean>('UserData_EnableDownload');

	if (!downloadEnabled) {
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');
		res.writeHead(403);
		res.end(getErrorPage(TAPi18n.__('Feature_Disabled'), TAPi18n.__('UserDataDownload_FeatureDisabled')));
		return;
	}

	const fileId = req.url ? /^\/([^\/]+)/.exec(req.url)?.[1] : undefined;
	const file = fileId ? await UserDataFiles.findOneById(fileId) : undefined;

	if (!file) {
		res.writeHead(404);
		res.end();
		return;
	}

	if (!requestCanAccessFiles(req as IIncomingMessage, file.userId)) {
		res.setHeader('Content-Type', 'text/html; charset=UTF-8');
		res.writeHead(403);
		res.end(getErrorPage(TAPi18n.__('403'), TAPi18n.__('UserDataDownload_LoginNeeded')));
		return;
	}

	res.setHeader('Content-Security-Policy', "default-src 'none'");
	res.setHeader('Cache-Control', 'max-age=31536000');
	get(file, req as IIncomingMessage, res, next);
});
