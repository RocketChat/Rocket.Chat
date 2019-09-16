import { Meteor } from 'meteor/meteor';

import {
	renderSVGLetters,
	serveAvatar,
	wasFallbackModified,
	setCacheAndDispositionHeaders,
} from './utils';
import { Rooms } from '../../../app/models/server';
import { roomTypes } from '../../../app/utils';


const getRoom = (roomId) => {
	const room = Rooms.findOneById(roomId, { fields: { t: 1, prid: 1, name: 1, fname: 1 } });

	// if it is a discussion, returns the parent room
	if (room.prid) {
		return Rooms.findOneById(room.prid, { fields: { t: 1, name: 1, fname: 1 } });
	}
	return room;
};

export const roomAvatar = Meteor.bindEnvironment(function(req, res/* , next*/) {
	const roomId = req.url.substr(1);
	const room = getRoom(roomId);

	const roomName = roomTypes.getConfig(room.t).roomName(room);

	setCacheAndDispositionHeaders(req, res);

	const reqModifiedHeader = req.headers['if-modified-since'];
	if (!wasFallbackModified(reqModifiedHeader, res)) {
		res.writeHead(304);
		res.end();
		return;
	}

	const svg = renderSVGLetters(roomName, req.query.size && parseInt(req.query.size));

	return serveAvatar(svg, req.query.format, res);
});
