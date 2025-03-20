import type { IncomingMessage, ServerResponse } from 'http';

import { hashLoginToken } from '@rocket.chat/account-utils';
import type { IIncomingMessage, IUser, IUserDataFile } from '@rocket.chat/core-typings';
import { UserDataFiles, Users } from '@rocket.chat/models';
import { Cookies } from 'meteor/ostrio:cookies';
import { WebApp } from 'meteor/webapp';
import { match } from 'path-to-regexp';

import { FileUpload } from '../../app/file-upload/server';
import { settings } from '../../app/settings/server';

const cookies = new Cookies();

const matchUID = async (uid: string | undefined, token: string | undefined, ownerUID: string) => {
	return (
		uid &&
		token &&
		uid === ownerUID &&
		Boolean(await Users.findOneByIdAndLoginToken(uid, hashLoginToken(token), { projection: { _id: 1 } }))
	);
};

const isRequestFromOwner = async (req: IIncomingMessage, ownerUID: IUser['_id']) => {
	if (await matchUID(req.query.rc_uid, req.query.rc_token, ownerUID)) {
		return true;
	}

	if (
		req.headers.cookie &&
		(await matchUID(cookies.get('rc_uid', req.headers.cookie), cookies.get('rc_token', req.headers.cookie), ownerUID))
	) {
		return true;
	}

	for await (const uid of [req.headers['x-user-id']].flat()) {
		for await (const token of [req.headers['x-auth-token']].flat()) {
			if (await matchUID(uid, token, ownerUID)) {
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
	void userDataStore.get(file, req, res, next);
};

const matchFileRoute = match<{ fileID: string }>('/:fileID', { decode: decodeURIComponent });

const userDataDownloadHandler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
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

	if (!file.userId || !(await isRequestFromOwner(req as IIncomingMessage, file.userId))) {
		res.writeHead(403).end();
		return;
	}

	sendUserDataFile(file)(req, res, next);
};

WebApp.connectHandlers.use('/data-export/', userDataDownloadHandler);
