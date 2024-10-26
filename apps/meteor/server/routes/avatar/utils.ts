import type { ServerResponse } from 'http';

import { hashLoginToken } from '@rocket.chat/account-utils';
import type { IIncomingMessage, IUpload } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { NextFunction } from 'connect';
import { Cookies } from 'meteor/ostrio:cookies';
import sharp from 'sharp';
import { throttle } from 'underscore';

import { FileUpload } from '../../../app/file-upload/server';
import { settings } from '../../../app/settings/server';
import { getAvatarColor } from '../../../app/utils/lib/getAvatarColor';

const FALLBACK_LAST_MODIFIED = 'Thu, 01 Jan 2015 00:00:00 GMT';

const cookie = new Cookies();

export const MAX_SVG_AVATAR_SIZE = 1024;
export const MIN_SVG_AVATAR_SIZE = 16;

export const serveAvatarFile = (file: IUpload, req: IIncomingMessage, res: ServerResponse, next: NextFunction) => {
	res.setHeader('Content-Security-Policy', "default-src 'none'");
	const reqModifiedHeader = req.headers['if-modified-since'];

	if (reqModifiedHeader && reqModifiedHeader === file.uploadedAt?.toUTCString()) {
		res.setHeader('Last-Modified', reqModifiedHeader);
		res.writeHead(304);
		res.end();
		return;
	}

	if (file.uploadedAt) {
		res.setHeader('Last-Modified', file.uploadedAt?.toUTCString());
	}

	if (file.type) {
		res.setHeader('Content-Type', file.type);
	}

	if (file.size) {
		res.setHeader('Content-Length', file.size);
	}

	return FileUpload.get(file, req, res, next);
};

export const getAvatarSizeFromRequest = (req: IIncomingMessage) => {
	const requestSize = req.query.size && parseInt(req.query.size);
	return Math.min(Math.max(requestSize, MIN_SVG_AVATAR_SIZE), MAX_SVG_AVATAR_SIZE);
};
export const serveSvgAvatarInRequestedFormat = ({
	nameOrUsername,
	req,
	res,
}: {
	nameOrUsername: string;
	req: IIncomingMessage;
	res: ServerResponse;
}) => {
	const size = getAvatarSizeFromRequest(req);
	const avatar = renderSVGLetters(nameOrUsername, size);
	res.setHeader('Last-Modified', FALLBACK_LAST_MODIFIED);

	const { format } = req.query;

	if (['png', 'jpg', 'jpeg'].includes(format)) {
		res.setHeader('Content-Type', `image/${format}`);
		sharp(Buffer.from(avatar)).toFormat(format).pipe(res);
		return;
	}
	res.setHeader('Content-Type', 'image/svg+xml');

	res.write(avatar);
	res.end();
};

export const wasFallbackModified = (reqModifiedHeader?: string) => {
	if (!reqModifiedHeader || reqModifiedHeader !== FALLBACK_LAST_MODIFIED) {
		return true;
	}
	return false;
};

async function isUserAuthenticated({ headers, query }: Pick<IIncomingMessage, 'headers' | 'query'>) {
	let { rc_uid, rc_token } = query;

	if (!rc_uid && headers.cookie) {
		rc_uid = cookie.get('rc_uid', headers.cookie);
		rc_token = cookie.get('rc_token', headers.cookie);
	}

	if (rc_uid == null || rc_token == null) {
		return false;
	}

	const userFound = await Users.findOneByIdAndLoginToken(rc_uid, hashLoginToken(rc_token), { projection: { _id: 1 } }); // TODO memoize find

	return !!userFound;
}

const warnUnauthenticatedAccess = throttle(() => {
	console.warn('The server detected an unauthenticated access to an user avatar. This type of request will soon be blocked by default.');
}, 60000 * 30); // 30 minutes

export async function userCanAccessAvatar({ headers = {}, query = {} }: IIncomingMessage) {
	if (!settings.get('Accounts_AvatarBlockUnauthenticatedAccess')) {
		return true;
	}

	const isAuthenticated = await isUserAuthenticated({ headers, query });
	if (!isAuthenticated) {
		warnUnauthenticatedAccess();
	}

	return isAuthenticated;
}

const getFirstLetter = (name: string) =>
	name
		.replace(/[^A-Za-z0-9]/g, '')
		.substr(0, 1)
		.toUpperCase();

export const renderSVGLetters = (username: string, viewSize = 200) => {
	let color = '';
	let initials = '';

	if (username === '?') {
		color = '#000';
		initials = username;
	} else {
		color = getAvatarColor(username);
		initials = getFirstLetter(username);
	}

	const fontSize = viewSize / 1.6;

	return `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ${viewSize} ${viewSize}\">\n<rect width=\"100%\" height=\"100%\" fill=\"${color}\"/>\n<text x=\"50%\" y=\"50%\" dy=\"0.36em\" text-anchor=\"middle\" pointer-events=\"none\" fill=\"#ffffff\" font-family=\"'Helvetica', 'Arial', 'Lucida Grande', 'sans-serif'\" font-size="${fontSize}">\n${initials}\n</text>\n</svg>`;
};

const getCacheTime = (cacheTime: number) => cacheTime || settings.get('Accounts_AvatarCacheTime');

export function setCacheAndDispositionHeaders(req: IIncomingMessage, res: ServerResponse) {
	const cacheTime = getCacheTime(req.query.cacheTime);
	res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);
	res.setHeader('Content-Disposition', 'inline');
}
