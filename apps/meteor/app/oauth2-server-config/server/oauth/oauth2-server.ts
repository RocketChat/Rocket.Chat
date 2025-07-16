import type { IUser } from '@rocket.chat/core-typings';
import { OAuthAccessTokens, Users } from '@rocket.chat/models';
import type { Request, Response } from 'express';
import type express from 'express';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { OAuth2Server } from '../../../../server/oauth2-server/oauth';
import { API } from '../../../api/server';

const oauth2server = new OAuth2Server({
	// If you're developing something related to oauth servers, you should change this to true
	debug: false,
});

// https://github.com/RocketChat/rocketchat-oauth2-server/blob/e758fd7ef69348c7ceceabe241747a986c32d036/model.coffee#L27-L27
async function getAccessToken(accessToken: string) {
	return OAuthAccessTokens.findOneByAccessToken(accessToken);
}

export async function oAuth2ServerAuth(partialRequest: {
	headers: Record<string, any>;
	query: Record<string, any>;
}): Promise<{ user: IUser } | undefined> {
	const headerToken = partialRequest.headers.authorization?.replace('Bearer ', '');
	const queryToken = partialRequest.query.access_token;

	const accessToken = await getAccessToken(headerToken || queryToken);

	// If there is no token available or the token has expired, return undefined
	if (!accessToken || (accessToken.expires != null && accessToken.expires < new Date())) {
		return;
	}

	const user = await Users.findOneById(accessToken.userId);

	if (user == null) {
		return;
	}

	return { user };
}

oauth2server.app.disable('x-powered-by');

oauth2server.app.get('/oauth/userinfo', async (req: Request, res: Response) => {
	if (req.headers.authorization == null) {
		return res.status(401).send('No token');
	}
	const accessToken = req.headers.authorization.replace('Bearer ', '');
	const token = await getAccessToken(accessToken);
	if (token == null) {
		return res.status(401).send('Invalid Token');
	}
	const user = await Users.findOneById(token.userId);
	if (user == null) {
		return res.status(401).send('Invalid Token');
	}
	return res.send({
		sub: user._id,
		name: user.name,
		email: user.emails?.[0].address,
		email_verified: user.emails?.[0].verified,
		department: '',
		birthdate: '',
		preffered_username: user.username,
		updated_at: user._updatedAt,
		picture: `${Meteor.absoluteUrl()}avatar/${user.username}`,
	});
});

API.v1.addAuthMethod(async function () {
	return oAuth2ServerAuth(this.request);
});

(WebApp.connectHandlers as unknown as ReturnType<typeof express>).use(oauth2server.app);
