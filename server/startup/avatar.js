import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import sharp from 'sharp';
import { Cookies } from 'meteor/ostrio:cookies';
import { FileUpload } from '../../app/file-upload';
import { getAvatarColor } from '../../app/utils';
import { Users, Avatars, Rooms } from '../../app/models/server';
import { settings } from '../../app/settings';

const cookie = new Cookies();

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

const warnUnauthenticatedAccess = _.debounce(() => {
	console.warn('The server detected an unauthenticated access to an user avatar. This type of request will soon be blocked by default.');
}, 60000 * 30); // 30 minutes

function userCanAccessAvatar(req) {
	if (settings.get('Accounts_AvatarBlockUnauthenticatedAccess') === true) {
		return isUserAuthenticated(req);
	}

	if (!isUserAuthenticated(req)) {
		warnUnauthenticatedAccess();
	}

	return true;
}

const renderSVGLetters = (username, viewSize = 200) => {
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

const FALLBACK_LAST_MODIFIED = 'Thu, 01 Jan 2015 00:00:00 GMT';
const serveAvatar = (avatar, req, res) => {
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

const wasFallbackModified = (reqModifiedHeader, res) => {
	if (!reqModifiedHeader || reqModifiedHeader !== FALLBACK_LAST_MODIFIED) {
		return true;
	}
	res.writeHead(304);
	res.end();
	return false;
};

// request /avatar/@name forces returning the svg
WebApp.connectHandlers.use('/avatar/', Meteor.bindEnvironment(function(req, res, next) {

	// skip if requesting room avatar
	if (req.url.match(/^\/room\//)) {
		return next();
	}

	const requestUsername = decodeURIComponent(req.url.substr(1).replace(/\?.*$/, ''));

	if (!requestUsername) {
		res.writeHead(404);
		res.end();
		return;
	}

	if (!userCanAccessAvatar(req)) {
		res.writeHead(403);
		res.write('Forbidden');
		res.end();
		return;
	}

	const avatarSize = req.query.size && parseInt(req.query.size);

	const reqModifiedHeader = req.headers['if-modified-since'];

	const cacheTime = req.query.cacheTime || settings.get('Accounts_AvatarCacheTime');
	res.setHeader('Cache-Control', `public, max-age=${ cacheTime }`);

	res.setHeader('Content-Disposition', 'inline');

	// if request starts with @ always return the svg letters
	if (requestUsername.substr(0, 1) === '@') {
		const svg = renderSVGLetters(requestUsername.substr(1), avatarSize);
		serveAvatar(svg, req, res);
		return;
	}

	const file = Avatars.findOneByName(requestUsername);
	if (file) {
		res.setHeader('Content-Security-Policy', 'default-src \'none\'');

		if (reqModifiedHeader && reqModifiedHeader === (file.uploadedAt && file.uploadedAt.toUTCString())) {
			res.setHeader('Last-Modified', reqModifiedHeader);
			res.writeHead(304);
			res.end();
			return;
		}

		res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
		res.setHeader('Content-Type', file.type);
		res.setHeader('Content-Length', file.size);

		return FileUpload.get(file, req, res);
	}

	// if still using "letters fallback"
	if (!wasFallbackModified(reqModifiedHeader, res)) {
		return;
	}

	let svg = renderSVGLetters(requestUsername, avatarSize);

	if (settings.get('UI_Use_Name_Avatar')) {
		const user = Users.findOneByUsername(requestUsername, {
			fields: {
				name: 1,
			},
		});

		if (user && user.name) {
			svg = renderSVGLetters(user.name, avatarSize);
		}
	}

	serveAvatar(svg, req, res);
	return;
}));

WebApp.connectHandlers.use('/avatar/room/', Meteor.bindEnvironment(function(req, res/* , next*/) {
	const roomId = req.url.substr(1);
	const requestRoom = Rooms.findOneById(roomId, { fields: { name: 1, prid: 1 } });

	let room;

	// if it is not a discussion, gets the parent room
	if (requestRoom.prid) {
		room = Rooms.findOneById(requestRoom.prid, { fields: { name: 1 } });
	} else {
		room = requestRoom;
	}

	const cacheTime = req.query.cacheTime || settings.get('Accounts_AvatarCacheTime');
	res.setHeader('Cache-Control', `public, max-age=${ cacheTime }`);

	res.setHeader('Content-Disposition', 'inline');

	const reqModifiedHeader = req.headers['if-modified-since'];
	if (!wasFallbackModified(reqModifiedHeader, res)) {
		return;
	}

	const svg = renderSVGLetters(room.name, req.query.size && parseInt(req.query.size));

	return serveAvatar(svg, req, res);
}));
