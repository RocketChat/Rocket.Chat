import type { IncomingMessage, ServerResponse } from 'node:http';

import { hashLoginToken } from '@rocket.chat/account-utils';
import type { IContact, IIncomingMessage, IUser } from '@rocket.chat/core-typings';
import { Avatars, Contacts, Users } from '@rocket.chat/models';
import type { NextFunction } from 'connect';
import { Cookies } from 'meteor/ostrio:cookies';

import { serveSvgAvatarInRequestedFormat, wasFallbackModified, setCacheAndDispositionHeaders, serveAvatarFile } from './utils';

const cookies = new Cookies();

const isRequestFromOwner = async (req: IIncomingMessage, ownerUID: IUser['_id']): Promise<boolean> => {
	const matchesOwner = async (uid?: string, token?: string): Promise<boolean> =>
		Boolean(
			uid && token && uid === ownerUID && (await Users.findOneByIdAndLoginToken(uid, hashLoginToken(token), { projection: { _id: 1 } })),
		);

	if (await matchesOwner(req.query.rc_uid, req.query.rc_token)) {
		return true;
	}

	return Boolean(
		req.headers.cookie && (await matchesOwner(cookies.get('rc_uid', req.headers.cookie), cookies.get('rc_token', req.headers.cookie))),
	);
};

export const contactAvatar = async function (request: IncomingMessage, res: ServerResponse, next: NextFunction) {
	const req = request as IIncomingMessage;

	if (!req.url) {
		return;
	}

	const contactId = decodeURIComponent(req.url.slice(1).replace(/\?.*$/, ''));

	const contact = await Contacts.findOneById<Pick<IContact, '_id' | 'uid' | 'displayName' | 'folderId' | 'externalId'>>(contactId, {
		projection: { uid: 1, displayName: 1, folderId: 1, externalId: 1 },
	});

	if (!contact || !(await isRequestFromOwner(req, contact.uid))) {
		res.writeHead(404);
		res.end();
		return;
	}

	setCacheAndDispositionHeaders(req, res);

	const file =
		contact.folderId && contact.externalId ? await Avatars.findOneContactAvatar(contact.uid, contact.folderId, contact.externalId) : null;

	if (file) {
		void serveAvatarFile(file, req, res, next);
		return;
	}

	if (!wasFallbackModified(req.headers['if-modified-since'])) {
		res.writeHead(304);
		res.end();
		return;
	}

	serveSvgAvatarInRequestedFormat({ nameOrUsername: contact.displayName, req, res, useAllInitials: true });
};
