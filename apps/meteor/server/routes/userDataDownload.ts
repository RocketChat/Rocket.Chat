import type { IncomingMessage, ServerResponse } from 'http';

import { match } from 'path-to-regexp';
import { WebApp } from 'meteor/webapp';
import { UserDataFiles } from '@rocket.chat/models';
import type { IIncomingMessage, IUser, IUserDataFile } from '@rocket.chat/core-typings';
import { Cookies } from 'meteor/ostrio:cookies';

import { FileUpload } from '../../app/file-upload/server';
import { settings } from '../../app/settings/server';
import Users from '../../app/models/server/models/Users';

const cookies = new Cookies();

const matchUID = (uid: string | undefined, token: string | undefined, ownerUID: string) => {
	return uid && token && uid === ownerUID && Boolean(Users.findOneByIdAndLoginToken(uid, token, { fields: { _id: 1 } }));
};

const isRequestFromOwner = (req: IIncomingMessage, ownerUID: IUser['_id']) => {
	if (matchUID(req.query.rc_uid, req.query.rc_token, ownerUID)) {
		return true;
	}

	if (req.headers.cookie && matchUID(cookies.get(req.headers.cookie, 'rc_uid'), cookies.get(req.headers.cookie, 'rc_token'), ownerUID)) {
		return true;
	}

	for (const uid of [req.headers['x-user-id']].flat()) {
		for (const token of [req.headers['x-auth-token']].flat()) {
			if (matchUID(uid, token, ownerUID)) {
				return true;
			}
		}
	}

	return false;
};

const sendUserDataFile = (file: IUserDataFile) => (req: IncomingMessage, res: ServerResponse, next: () => void) => {
	const userDataStore = FileUpload.getStore('UserDataFiles');
	if (!userDataStore?.get) {
		res.writeHead(403).end(); // @todo: maybe we should return a better error?
		return;
	}

	res.setHeader('Content-Security-Policy', "default-src 'none'");
	res.setHeader('Cache-Control', 'max-age=31536000');
	userDataStore.get(file, req, res, next);
};

const matchFileRoute = match<{ fileID: string }>('/:fileID', { decode: decodeURIComponent });

const userDataDownloadHandler = Meteor.bindEnvironment(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
	const downloadEnabled = settings.get<boolean>('UserData_EnableDownload');
	if (!downloadEnabled) {
		res.writeHead(403).end();
		return;
	}

	const match = matchFileRoute(req.url ?? '/');
	if (match === false) {
		res.writeHead(404).end();
		return;
	}

	const file = await UserDataFiles.findOneById(match.params.fileID);
	if (!file) {
		res.writeHead(404).end();
		return;
	}

	if (!isRequestFromOwner(req as IIncomingMessage, file.userId)) {
		res.writeHead(403).end();
		return;
	}

	sendUserDataFile(file)(req, res, next);
});

WebApp.connectHandlers.use('/data-export/', userDataDownloadHandler);
