import type { IncomingMessage, ServerResponse } from 'http';

import type { IIncomingMessage, IRoom, IUpload } from '@rocket.chat/core-typings';
import { Avatars, Rooms } from '@rocket.chat/models';
import type { NextFunction } from 'connect';
import { Cookies } from 'meteor/ostrio:cookies';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { serveSvgAvatarInRequestedFormat, wasFallbackModified, setCacheAndDispositionHeaders, serveAvatarFile } from './utils';

const cookie = new Cookies();
const getRoomAndAvatarFile = async (roomId: IRoom['_id']): Promise<{ room: IRoom; file: IUpload | null } | void> => {
	const room = await Rooms.findOneById(roomId);
	if (!room) {
		return;
	}

	const file = await Avatars.findOneByRoomId(room._id);

	// if it is a discussion that doesn't have it's own avatar, returns the parent's room avatar
	if (room.prid && !file) {
		return getRoomAndAvatarFile(room.prid);
	}

	return { room, file };
};

export const roomAvatar = async function (request: IncomingMessage, res: ServerResponse, next: NextFunction) {
	const req = request as IIncomingMessage;

	if (!req.url) {
		return;
	}

	const roomId = decodeURIComponent(req.url.slice(1).replace(/\?.*$/, ''));

	const { room, file } = (await getRoomAndAvatarFile(roomId)) || {};
	if (!room) {
		res.writeHead(404);
		res.end();
		return;
	}

	setCacheAndDispositionHeaders(req, res);

	if (file) {
		void serveAvatarFile(file, req, res, next);
		return;
	}

	if (!wasFallbackModified(req.headers['if-modified-since'])) {
		res.writeHead(304);
		res.end();
		return;
	}

	const uid = req.headers.cookie && cookie.get('rc_uid', req.headers.cookie);
	const roomName = await roomCoordinator.getRoomName(room.t, room, uid);

	serveSvgAvatarInRequestedFormat({ nameOrUsername: roomName, req, res });
};
