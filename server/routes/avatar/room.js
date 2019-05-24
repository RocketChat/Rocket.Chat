import { Meteor } from 'meteor/meteor';

import {
	renderSVGLetters,
	serveAvatar,
	wasFallbackModified,
	setCacheAndDispositionHeaders,
} from './utils';
import { Rooms, Avatars } from '../../../app/models/server';
import { roomTypes } from '../../../app/utils';
import { FileUpload } from '../../../app/file-upload';


const getRoom = (roomId) => {
	const room = Rooms.findOneById(roomId, { fields: { t: 1, prid: 1, name: 1, fname: 1 } });

	// if it is a discussion, returns the parent room
	if (room && room.prid) {
		return Rooms.findOneById(room.prid, { fields: { t: 1, name: 1, fname: 1 } });
	}
	return room;
};

export const roomAvatar = Meteor.bindEnvironment(function(req, res/* , next*/) {
	const roomId = req.url.substr(1);
	const room = getRoom(roomId);

	if (!room) {
		res.writeHead(404);
		res.end();
		return;
	}

	const roomName = roomTypes.getConfig(room.t).roomName(room);

	setCacheAndDispositionHeaders(req, res);

	const reqModifiedHeader = req.headers['if-modified-since'];

	const file = Avatars.findOneByName(room._id);
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

	if (!wasFallbackModified(reqModifiedHeader, res)) {
		res.writeHead(304);
		res.end();
		return;
	}

	const svg = renderSVGLetters(roomName, req.query.size && parseInt(req.query.size));

	return serveAvatar(svg, req.query.format, res);
});
