import { Cookies } from 'meteor/ostrio:cookies';

import Users from '../../models/server/models/Users';
import { FileUpload } from '../../file-upload/server';

const cookie = new Cookies();
const userDataStore = FileUpload.getStore('UserDataFiles');

export const DataExport = {
	handlers: {},

	getPath(path = '') {
		return `/data-export/${ path }`;
	},

	requestCanAccessFiles({ headers = {}, query = {} }, userId) {
		let { rc_uid, rc_token } = query;

		if (!rc_uid && headers.cookie) {
			rc_uid = cookie.get('rc_uid', headers.cookie);
			rc_token = cookie.get('rc_token', headers.cookie);
		}

		const isAuthorizedByCookies = rc_uid && rc_token && Users.findOneByIdAndLoginToken(rc_uid, rc_token) && rc_uid === userId;
		const isAuthorizedByHeaders = headers['x-user-id'] && headers['x-auth-token'] && Users.findOneByIdAndLoginToken(headers['x-user-id'], headers['x-auth-token']);
		return isAuthorizedByCookies || isAuthorizedByHeaders;
	},

	get(file, req, res, next) {
		if (userDataStore && userDataStore.get) {
			return userDataStore.get(file, req, res, next);
		}
		res.writeHead(404);
		res.end();
	},

};
