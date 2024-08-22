import { Avatars, Rooms } from '@rocket.chat/models';
import { Cookies } from 'meteor/ostrio:cookies';

import { FileUpload } from '../../../app/file-upload/server';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { renderSVGLetters, serveAvatar, wasFallbackModified, setCacheAndDispositionHeaders } from './utils';

const MAX_ROOM_SVG_AVATAR_SIZE = 1024;
const MIN_ROOM_SVG_AVATAR_SIZE = 16;

const cookie = new Cookies();
const getRoomAvatar = async (roomId) => {
	const room = await Rooms.findOneById(roomId, { projection: { t: 1, prid: 1, name: 1, fname: 1, federated: 1 } });
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

export const roomAvatar = async function (req, res /* , next*/) {
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

	const roomName = await roomCoordinator.getRoomName(room.t, room, uid);

	setCacheAndDispositionHeaders(req, res);

	if (!wasFallbackModified(reqModifiedHeader, res)) {
		res.writeHead(304);
		res.end();
		return;
	}

	let avatarSize = req.query.size && parseInt(req.query.size);
	if (avatarSize) {
		avatarSize = Math.min(Math.max(avatarSize, MIN_ROOM_SVG_AVATAR_SIZE), MAX_ROOM_SVG_AVATAR_SIZE);
	}

	const svg = renderSVGLetters(roomName, avatarSize);

	return serveAvatar(svg, req.query.format, res);
};
