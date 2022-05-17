import { Meteor } from 'meteor/meteor';
import { Cookies } from 'meteor/ostrio:cookies';

import { renderSVGLetters, serveAvatar, wasFallbackModified, setCacheAndDispositionHeaders } from './utils';
import { FileUpload } from '../../../app/file-upload';
import { Rooms } from '../../../app/models/server';
import { Avatars } from '../../../app/models/server/raw';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const cookie = new Cookies();
const getRoomAvatar = async (roomId) => {
	const room = Rooms.findOneById(roomId, { fields: { t: 1, prid: 1, name: 1, fname: 1 } });
	if (!room) {
		return {};
	}

	const file = await Avatars.findOneByRoomId(room._id);

	// if it is a discussion that doesn't have it's own avatar, returns the parent's room avatar
	if (room.prid && !file) {
		return getRoomAvatar(room.prid);
	}

	return { room, file };
};

export const roomAvatar = Meteor.bindEnvironment(async function (req, res /* , next*/) {
	const roomId = decodeURIComponent(req.url.substr(1).replace(/\?.*$/, ''));

	const { room, file } = await getRoomAvatar(roomId);
	if (!room) {
		res.writeHead(404);
		res.end();
		return;
	}

	const uid = req.headers.cookie && cookie.get('rc_uid', req.headers.cookie);

	const reqModifiedHeader = req.headers['if-modified-since'];
	if (file) {
		res.setHeader('Content-Security-Policy', "default-src 'none'");

		if (reqModifiedHeader && reqModifiedHeader === file.uploadedAt?.toUTCString()) {
			res.setHeader('Last-Modified', reqModifiedHeader);
			res.writeHead(304);
			res.end();
			return;
		}

		if (file.uploadedAt) {
			res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
		}
		res.setHeader('Content-Type', file.type);
		res.setHeader('Content-Length', file.size);

		return FileUpload.get(file, req, res);
	}

	const roomName = roomCoordinator.getRoomName(room.t, room, uid);

	setCacheAndDispositionHeaders(req, res);

	if (!wasFallbackModified(reqModifiedHeader, res)) {
		res.writeHead(304);
		res.end();
		return;
	}

	const svg = renderSVGLetters(roomName, req.query.size && parseInt(req.query.size));

	return serveAvatar(svg, req.query.format, res);
});
