import type { ServerResponse } from 'http';

import { Cookies } from 'meteor/ostrio:cookies';
import type { IIncomingMessage, IUser } from '@rocket.chat/core-typings';

import Users from '../../app/models/server/models/Users';
import { FileUpload } from '../../app/file-upload/server';
import { getURL } from '../../app/utils/lib/getURL';

const cookie = new Cookies();
const userDataStore = FileUpload.getStore('UserDataFiles');

export const DataExport = {
	handlers: {},

	getPath(path = '') {
		return `/data-export/${path}`;
	},

	requestCanAccessFiles({ headers = {}, query = {} }: IIncomingMessage, userId?: IUser['_id']) {
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
	},

	get(file: any, req: IIncomingMessage, res: ServerResponse, next: () => void) {
		if (userDataStore?.get) {
			return userDataStore.get(file, req, res, next);
		}

		res.writeHead(404);
		res.end();
	},

	getErrorPage(errorType: string, errorDescription: string): string {
		let errorHtml = Assets.getText('errors/error_template.html') ?? '';
		errorHtml = errorHtml.replace('$ERROR_TYPE$', errorType);
		errorHtml = errorHtml.replace('$ERROR_DESCRIPTION$', errorDescription);
		errorHtml = errorHtml.replace('$SERVER_URL$', getURL('/', { full: true, cdn: false }));
		return errorHtml;
	},
};
