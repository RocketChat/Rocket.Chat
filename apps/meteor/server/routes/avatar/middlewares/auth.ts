import type { IncomingMessage, ServerResponse } from 'http';

import type { IIncomingMessage } from '@rocket.chat/core-typings';
import type { NextFunction } from 'connect';

import { userCanAccessAvatar, renderSVGLetters } from '../utils';

const renderFallback = (req: IncomingMessage, res: ServerResponse) => {
	if (!req.url) {
		res.writeHead(404);
		res.end();
		return;
	}

	let roomOrUsername;

	if (req.url.startsWith('/room')) {
		roomOrUsername = req.url.split('/')[2] || 'Room';
	} else {
		roomOrUsername = req.url.split('/')[1] || 'Anonymous';
	}

	res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
	res.write(renderSVGLetters(roomOrUsername, 200));
	res.end();
};

const getProtectAvatars = (callback?: typeof renderFallback) => async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
	if (!(await userCanAccessAvatar(req as IIncomingMessage))) {
		if (callback) {
			callback(req, res);
			return;
		}

		res.writeHead(404);
		res.end();
		return;
	}

	return next();
};

// If unauthorized returns the SVG fallback (letter avatar)
export const protectAvatarsWithFallback = getProtectAvatars(renderFallback);

// Just returns 404
export const protectAvatars = getProtectAvatars();
