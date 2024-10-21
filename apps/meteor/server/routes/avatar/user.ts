import type { ServerResponse } from 'http';

import type { IUpload, IIncomingMessage } from '@rocket.chat/core-typings';
import { Avatars, Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import type { NextFunction } from 'connect';

import { FileUpload } from '../../../app/file-upload/server';
import { settings } from '../../../app/settings/server';
import { renderSVGLetters, serveSvgAvatarInRequestedFormat, wasFallbackModified, setCacheAndDispositionHeaders } from './utils';

const MAX_USER_SVG_AVATAR_SIZE = 1024;
const MIN_USER_SVG_AVATAR_SIZE = 16;

const serveSvgAvatar = (nameOrUsername: string, size: number, format: string, res: ServerResponse) => {
	const svg = renderSVGLetters(nameOrUsername, size);
	serveSvgAvatarInRequestedFormat(svg, format, res);
};

const getAvatarSizeFromRequest = (req: IIncomingMessage) => {
	const requestSize = req.query.size && parseInt(req.query.size);
	return Math.min(Math.max(requestSize, MIN_USER_SVG_AVATAR_SIZE), MAX_USER_SVG_AVATAR_SIZE);
};

const serveAvatarFile = (file: IUpload, req: IIncomingMessage, res: ServerResponse, next: NextFunction) => {
	res.setHeader('Content-Security-Policy', "default-src 'none'");
	const reqModifiedHeader = req.headers['if-modified-since'];

	if (reqModifiedHeader && reqModifiedHeader === file.uploadedAt?.toUTCString()) {
		res.setHeader('Last-Modified', reqModifiedHeader);
		res.writeHead(304);
		res.end();
		return;
	}

	res.setHeader('Last-Modified', `${file.uploadedAt?.toUTCString()}`);
	res.setHeader('Content-Type', file.type || '');
	res.setHeader('Content-Length', file.size || 0);

	return FileUpload.get(file, req, res, next);
};

const handleExternalProvider = async (externalProviderUrl: string, username: string, res: ServerResponse): Promise<boolean> => {
	const response = await fetch(externalProviderUrl.replace('{username}', username));
	response.headers.forEach((value, key) => res.setHeader(key, value));
	response.body.pipe(res);
	return true;
};

// request /avatar/@name forces returning the svg
export const userAvatarByUsername = async function (req: IIncomingMessage, res: ServerResponse, next: NextFunction) {
	if (!req.url) {
		return;
	}

	const requestUsername = decodeURIComponent(req.url?.substr(1).replace(/\?.*$/, ''));

	if (!requestUsername) {
		res.writeHead(404);
		res.end();
		return;
	}

	setCacheAndDispositionHeaders(req, res);

	const externalProviderUrl = settings.get<string>('Accounts_AvatarExternalProviderUrl');
	if (externalProviderUrl) {
		void handleExternalProvider(externalProviderUrl, requestUsername, res);
		return;
	}

	const avatarSize = getAvatarSizeFromRequest(req);
	// if request starts with @ always return the svg letters
	if (requestUsername[0] === '@') {
		serveSvgAvatar(requestUsername.slice(1), avatarSize, req.query.format, res);
		return;
	}

	const file = await Avatars.findOneByName(requestUsername);
	if (file) {
		void serveAvatarFile(file, req, res, next);
		return;
	}

	// if still using "letters fallback"
	if (!wasFallbackModified(req.headers['if-modified-since'])) {
		res.writeHead(304);
		res.end();
		return;
	}

	// Use real name for SVG letters
	if (settings.get('UI_Use_Name_Avatar')) {
		const user = await Users.findOneByUsernameIgnoringCase(requestUsername, {
			projection: {
				name: 1,
			},
		});

		if (user?.name) {
			serveSvgAvatar(user.name, avatarSize, req.query.format, res);
			return;
		}
	}

	serveSvgAvatar(requestUsername, avatarSize, req.query.format, res);
};

// This handler wont support `@` to force SVG letters
export const userAvatarById = async function (req: IIncomingMessage, res: ServerResponse, next: NextFunction) {
	if (!req.url) {
		return;
	}

	const requestUserId = decodeURIComponent(req.url?.substr(1).replace(/\?.*$/, ''));

	if (!requestUserId) {
		res.writeHead(404);
		res.end();
		return;
	}

	setCacheAndDispositionHeaders(req, res);

	const externalProviderUrl = settings.get<string>('Accounts_AvatarExternalProviderUrl');
	if (externalProviderUrl) {
		const user = await Users.findOneById(requestUserId, { projection: { username: 1, name: 1 } });

		if (!user?.username) {
			res.writeHead(404);
			res.end();
			return;
		}

		void handleExternalProvider(externalProviderUrl, user.username, res);
		return;
	}

	const file = await Avatars.findOne({ userId: requestUserId });
	if (file) {
		void serveAvatarFile(file, req, res, next);
		return;
	}

	const user = await Users.findOneById(requestUserId, { projection: { username: 1, name: 1 } });

	if (!user?.username) {
		res.writeHead(404);
		res.end();
		return;
	}

	// if still using "letters fallback"
	if (!wasFallbackModified(req.headers['if-modified-since'])) {
		res.writeHead(304);
		res.end();
		return;
	}

	const avatarSize = getAvatarSizeFromRequest(req);

	// Use real name for SVG letters
	if (settings.get('UI_Use_Name_Avatar') && user?.name) {
		serveSvgAvatar(user.name, avatarSize, req.query.format, res);
		return;
	}

	serveSvgAvatar(user.username, avatarSize, req.query.format, res);
};
