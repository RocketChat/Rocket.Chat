import type { IncomingMessage, ServerResponse } from 'http';

import type { IUser } from '@rocket.chat/apps-engine/definition/users';
import type { IIncomingMessage } from '@rocket.chat/core-typings';
import { Avatars, Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import type { NextFunction } from 'connect';

import { serveSvgAvatarInRequestedFormat, wasFallbackModified, setCacheAndDispositionHeaders, serveAvatarFile } from './utils';
import { settings } from '../../../app/settings/server';

const handleExternalProvider = async (externalProviderUrl: string, username: string, res: ServerResponse): Promise<void> => {
	const response = await fetch(externalProviderUrl.replace('{username}', username));
	response.headers.forEach((value, key) => res.setHeader(key, value));
	response.body.pipe(res);
};
// request /avatar/@name forces returning the svg
export const userAvatarByUsername = async function (request: IncomingMessage, res: ServerResponse, next: NextFunction) {
	const req = request as IIncomingMessage;

	if (!req.url) {
		return;
	}

	// replace removes the query string
	const requestUsername = decodeURIComponent(req.url.slice(1).replace(/\?.*$/, ''));
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

	// if request starts with @ always return the svg letters
	if (requestUsername[0] === '@') {
		serveSvgAvatarInRequestedFormat({
			nameOrUsername: requestUsername.slice(1),
			req,
			res,
			useAllInitials: settings.get('UI_Use_Name_Avatar'),
		});
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
			serveSvgAvatarInRequestedFormat({ nameOrUsername: user.name, req, res, useAllInitials: true });
			return;
		}
	}

	serveSvgAvatarInRequestedFormat({ nameOrUsername: requestUsername, req, res });
};

export const userAvatarById = async function (request: IncomingMessage, res: ServerResponse, next: NextFunction) {
	const req = request as IIncomingMessage;

	if (!req.url) {
		return;
	}

	// replace removes the query string
	const requestUserId = decodeURIComponent(req.url.slice(1).replace(/\?.*$/, ''));
	if (!requestUserId) {
		res.writeHead(404);
		res.end();
		return;
	}

	setCacheAndDispositionHeaders(req, res);

	const externalProviderUrl = settings.get<string>('Accounts_AvatarExternalProviderUrl');
	if (externalProviderUrl) {
		const user = await Users.findOneById<Pick<IUser, 'username'>>(requestUserId, { projection: { username: 1 } });

		if (!user?.username) {
			res.writeHead(404);
			res.end();
			return;
		}

		void handleExternalProvider(externalProviderUrl, user.username, res);
		return;
	}

	const file = await Avatars.findOneByUserId(requestUserId);
	if (file) {
		void serveAvatarFile(file, req, res, next);
		return;
	}

	if (!wasFallbackModified(req.headers['if-modified-since'])) {
		res.writeHead(304);
		res.end();
		return;
	}

	const user = await Users.findOneById<Pick<IUser, 'name' | 'username'>>(requestUserId, { projection: { username: 1, name: 1 } });
	if (!user?.username) {
		res.writeHead(404);
		res.end();
		return;
	}

	// Use real name for SVG letters
	if (settings.get('UI_Use_Name_Avatar') && user?.name) {
		serveSvgAvatarInRequestedFormat({ nameOrUsername: user.name, req, res, useAllInitials: true });
		return;
	}

	serveSvgAvatarInRequestedFormat({ nameOrUsername: user.username, req, res });
};
