import sharp from 'sharp';
import { throttle } from 'underscore';

import { Cookies } from 'meteor/ostrio:cookies';

import { Users } from '../../../app/models/server';
import { getAvatarColor } from '../../../app/utils';
import { settings } from '../../../app/settings/server';

const FALLBACK_LAST_MODIFIED = 'Thu, 01 Jan 2015 00:00:00 GMT';

const cookie = new Cookies();

export const getCacheTime = (req) => req.query.cacheTime || settings.get('Accounts_AvatarCacheTime');

export const serveAvatar = (avatar, req, res) => {
	res.setHeader('Last-Modified', FALLBACK_LAST_MODIFIED);

	if (['png', 'jpg', 'jpeg'].includes(req.query.format)) {
		res.setHeader('Content-Type', `image/${ req.query.format }`);
		sharp(new Buffer(avatar))
			.toFormat(req.query.format)
			.pipe(res);
		return;
	}
	res.setHeader('Content-Type', 'image/svg+xml');

	res.write(avatar);
	res.end();
};

export const wasFallbackModified = (reqModifiedHeader, res) => {
	if (!reqModifiedHeader || reqModifiedHeader !== FALLBACK_LAST_MODIFIED) {
		return true;
	}
	res.writeHead(304);
	res.end();
	return false;
};

function isUserAuthenticated(req) {
	const headers = req.headers || {};
	const query = req.query || {};

	let { rc_uid, rc_token } = query;

	if (!rc_uid && headers.cookie) {
		rc_uid = cookie.get('rc_uid', headers.cookie) ;
		rc_token = cookie.get('rc_token', headers.cookie);
	}

	if (!rc_uid || !rc_token || !Users.findOneByIdAndLoginToken(rc_uid, rc_token)) {
		return false;
	}

	return true;
}

const warnUnauthenticatedAccess = throttle(() => {
	console.warn('The server detected an unauthenticated access to an user avatar. This type of request will soon be blocked by default.');
}, 60000 * 30); // 30 minutes

export function userCanAccessAvatar(req) {
	const isAuthenticated = isUserAuthenticated(req);

	if (settings.get('Accounts_AvatarBlockUnauthenticatedAccess') === true) {
		return isAuthenticated;
	}

	if (!isAuthenticated) {
		warnUnauthenticatedAccess();
	}

	return true;
}

export const renderSVGLetters = (username, viewSize = 200) => {
	let color = '';
	let initials = '';

	if (username === '?') {
		color = '#000';
		initials = username;
	} else {
		color = getAvatarColor(username);

		initials = username.replace(/[^A-Za-z0-9]/g, '').substr(0, 1).toUpperCase();
	}

	const fontSize = viewSize / 1.6;

	return `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ${ viewSize } ${ viewSize }\">\n<rect width=\"100%\" height=\"100%\" fill=\"${ color }\"/>\n<text x=\"50%\" y=\"50%\" dy=\"0.36em\" text-anchor=\"middle\" pointer-events=\"none\" fill=\"#ffffff\" font-family=\"'Helvetica', 'Arial', 'Lucida Grande', 'sans-serif'\" font-size="${ fontSize }">\n${ initials }\n</text>\n</svg>`;
};

export function setCacheAndDispositionHeaders(req, res) {
	const cacheTime = getCacheTime(req);
	res.setHeader('Cache-Control', `public, max-age=${ cacheTime }`);
	res.setHeader('Content-Disposition', 'inline');
}
