import sharp from 'sharp';
import { throttle } from 'underscore';
import { Cookies } from 'meteor/ostrio:cookies';

import { Users } from '../../../app/models/server';
import { getAvatarColor } from '../../../app/utils';
import { settings } from '../../../app/settings/server';

const FALLBACK_LAST_MODIFIED = 'Thu, 01 Jan 2015 00:00:00 GMT';

const cookie = new Cookies();

export const serveAvatar = (avatar, format, res) => {
	res.setHeader('Last-Modified', FALLBACK_LAST_MODIFIED);

	if (['png', 'jpg', 'jpeg'].includes(format)) {
		res.setHeader('Content-Type', `image/${format}`);
		sharp(Buffer.from(avatar)).toFormat(format).pipe(res);
		return;
	}
	res.setHeader('Content-Type', 'image/svg+xml');

	res.write(avatar);
	res.end();
};

export const wasFallbackModified = (reqModifiedHeader) => {
	if (!reqModifiedHeader || reqModifiedHeader !== FALLBACK_LAST_MODIFIED) {
		return true;
	}
	return false;
};

function isUserAuthenticated({ headers, query }) {
	let { rc_uid, rc_token } = query;

	if (!rc_uid && headers.cookie) {
		rc_uid = cookie.get('rc_uid', headers.cookie);
		rc_token = cookie.get('rc_token', headers.cookie);
	}

	if (rc_uid == null || rc_token == null) {
		return false;
	}

	const userFound = Users.findOneByIdAndLoginToken(rc_uid, rc_token, { fields: { _id: 1 } }); // TODO memoize find

	return !!userFound;
}

const warnUnauthenticatedAccess = throttle(() => {
	console.warn('The server detected an unauthenticated access to an user avatar. This type of request will soon be blocked by default.');
}, 60000 * 30); // 30 minutes

export function userCanAccessAvatar({ headers = {}, query = {} }) {
	if (!settings.get('Accounts_AvatarBlockUnauthenticatedAccess')) {
		return true;
	}

	const isAuthenticated = isUserAuthenticated({ headers, query });
	if (!isAuthenticated) {
		warnUnauthenticatedAccess();
	}

	return isAuthenticated;
}

const getFirstLetter = (name) =>
	name
		.replace(/[^A-Za-z0-9]/g, '')
		.substr(0, 1)
		.toUpperCase();

export const renderSVGLetters = (username, viewSize = 200) => {
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

const getCacheTime = (cacheTime) => cacheTime || settings.get('Accounts_AvatarCacheTime');

export function setCacheAndDispositionHeaders(req, res) {
	const cacheTime = getCacheTime(req.query.cacheTime);
	res.setHeader('Cache-Control', `public, max-age=${cacheTime}`);
	res.setHeader('Content-Disposition', 'inline');
}
