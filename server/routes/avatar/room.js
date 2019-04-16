import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../app/models/server';

import {
	renderSVGLetters,
	serveAvatar,
	wasFallbackModified,
	setCacheAndDispositionHeaders,
} from './utils';

WebApp.connectHandlers.use('/avatar/room/', Meteor.bindEnvironment(function(req, res/* , next*/) {
	const roomId = req.url.substr(1);
	const requestRoom = Rooms.findOneById(roomId, { fields: { name: 1, prid: 1 } });

	let room;

	// if it is a discussion, gets the parent room
	if (requestRoom.prid) {
		room = Rooms.findOneById(requestRoom.prid, { fields: { name: 1 } });
	} else {
		room = requestRoom;
	}

	setCacheAndDispositionHeaders(req, res);

	const reqModifiedHeader = req.headers['if-modified-since'];
	if (!wasFallbackModified(reqModifiedHeader, res)) {
		return;
	}

	const svg = renderSVGLetters(room.name, req.query.size && parseInt(req.query.size));

	return serveAvatar(svg, req, res);
}));
