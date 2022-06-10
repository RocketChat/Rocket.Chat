import { Meteor } from 'meteor/meteor';

import { renderSVGLetters, serveAvatar, wasFallbackModified, setCacheAndDispositionHeaders } from './utils';
import { FileUpload } from '../../../app/file-upload';
import { settings } from '../../../app/settings/server';
import { Users } from '../../../app/models/server';
import { Avatars } from '../../../app/models/server/raw';

// request /avatar/@name forces returning the svg
export const userAvatar = Meteor.bindEnvironment(async function (req, res) {
	const requestUsername = decodeURIComponent(req.url.substr(1).replace(/\?.*$/, ''));

	if (!requestUsername) {
		res.writeHead(404);
		res.end();
		return;
	}

	const avatarSize = req.query.size && parseInt(req.query.size);

	setCacheAndDispositionHeaders(req, res);

	// if request starts with @ always return the svg letters
	if (requestUsername[0] === '@') {
		const svg = renderSVGLetters(requestUsername.substr(1), avatarSize);
		serveAvatar(svg, req.query.format, res);
		return;
	}

	const reqModifiedHeader = req.headers['if-modified-since'];

	const file = await Avatars.findOneByName(requestUsername);
	if (file) {
		res.setHeader('Content-Security-Policy', "default-src 'none'");

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
		res.writeHead(304);
		res.end();
		return;
	}

	let svg = renderSVGLetters(requestUsername, avatarSize);

	if (settings.get('UI_Use_Name_Avatar')) {
		const user = Users.findOneByUsernameIgnoringCase(requestUsername, {
			fields: {
				name: 1,
			},
		});

		if (user && user.name) {
			svg = renderSVGLetters(user.name, avatarSize);
		}
	}

	serveAvatar(svg, req.query.format, res);
});
