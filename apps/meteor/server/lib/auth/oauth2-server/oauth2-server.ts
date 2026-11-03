import type { IUser } from '@rocket.chat/core-typings';
import { OAuthAccessTokens, Users } from '@rocket.chat/models';
import type { NextFunction, Request, Response } from 'express';
import type express from 'express';
import rateLimit from 'express-rate-limit';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { registerOAuthClient } from './registerOAuthClient';
import { isPlainObject } from '../../../../lib/utils/isPlainObject';
import { API } from '../../../api';
import { serveAuthorizationServerMetadata } from '../../../oauth2-server/metadata';
import { OAuth2Server } from '../../../oauth2-server/oauth';
import { settings } from '../../../settings/cached';
import { httpApp } from '../../http/httpServer';

const oauth2server = new OAuth2Server({
	// If you're developing something related to oauth servers, you should change this to true
	debug: false,
});

// https://github.com/RocketChat/rocketchat-oauth2-server/blob/e758fd7ef69348c7ceceabe241747a986c32d036/model.coffee#L27-L27
async function getAccessToken(accessToken: string) {
	return OAuthAccessTokens.findOneByAccessToken(accessToken);
}

export async function oAuth2ServerAuth(partialRequest: { authorization?: string; accessToken?: string }): Promise<IUser | undefined> {
	const headerToken = partialRequest.authorization?.replace('Bearer ', '');
	const incomingToken = headerToken || partialRequest.accessToken;

	if (!incomingToken) {
		return;
	}

	const accessToken = await getAccessToken(incomingToken);

	// If there is no token available or the token has expired, return undefined
	if (!accessToken || (accessToken.expires != null && accessToken.expires < new Date())) {
		return;
	}

	const user = await Users.findOneActiveById(accessToken.userId);

	if (!user) {
		return;
	}

	return user;
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
	const user = await Users.findOneActiveById(token.userId);
	if (!user) {
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

// The registration limiter keys on `req.ip`, which must be the client rather than a reverse proxy; the proxies are counted
// the way the REST API counts them.
oauth2server.app.set('trust proxy', parseInt(String(process.env.HTTP_FORWARDED_COUNT)) || 0);

const registrationRateLimiter = rateLimit({
	windowMs: 60_000,
	max: () => settings.get<number>('API_Enable_Rate_Limiter_Limit_Calls_Default'),
	skip: () =>
		process.env.TEST_MODE === 'true' ||
		process.env.TEST_MODE === 'api' ||
		settings.get<boolean>('API_Enable_Rate_Limiter') !== true ||
		(process.env.NODE_ENV === 'development' && settings.get<boolean>('API_Enable_Rate_Limiter_Dev') !== true),
	handler: (_req, res) => {
		res.status(429).send({ error: 'too_many_requests', error_description: 'Too many registrations. Please try again later.' });
	},
});

oauth2server.app.post('/oauth/register', registrationRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { statusCode, body } = await registerOAuthClient(req.body);
		res.set('Cache-Control', 'no-store');
		res.status(statusCode).send(body);
	} catch (error) {
		next(error);
	}
});

API.v1.addAuthMethod((routeContext) => {
	const authorization = routeContext.request.headers.get('authorization') ?? undefined;
	const query = isPlainObject(routeContext.queryParams) ? routeContext.queryParams : {};
	const accessToken = typeof query.access_token === 'string' ? query.access_token : undefined;
	if (routeContext.queryParams && 'access_token' in routeContext.queryParams) {
		delete routeContext.queryParams.access_token;
	}

	return oAuth2ServerAuth({ authorization, accessToken });
});

(WebApp.connectHandlers as unknown as ReturnType<typeof express>).use(oauth2server.app);
httpApp.get('/.well-known/oauth-authorization-server/*', serveAuthorizationServerMetadata);
