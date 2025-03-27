import OAuthServer, { OAuthError, UnauthorizedRequestError } from '@node-oauth/oauth2-server';
import { OAuthApps, Users } from '@rocket.chat/models';
import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import { Accounts } from 'meteor/accounts-base';

import type { ModelConfig } from './model';
import { Model } from './model';

export class OAuth2Server {
	public app: Express;

	private oauth: OAuthServer;

	private config: ModelConfig;

	constructor(config: ModelConfig) {
		if (config == null) {
			config = {};
		}

		this.config = config;
		this.app = express();
		this.app.use(
			'/oauth/*',
			express.json({
				limit: '50mb',
			}),
			express.urlencoded({
				extended: true,
				limit: '50mb',
			}),
			express.query({}),
		);

		this.oauth = new OAuthServer({
			model: new Model(this.config),
		});

		this.initRoutes();

		return this;
	}

	initRoutes() {
		const { config, oauth } = this;

		const debugMiddleware = function (req: Request, _res: Response, next: NextFunction) {
			if (config.debug === true) {
				console.log('[OAuth2Server]', req.method, req.url);
			}
			return next();
		};

		const handleResponse = function (res: Response, response: OAuthServer.Response, next: NextFunction) {
			if (response.status === 302 && response.headers?.location) {
				const { location } = response.headers;
				delete response.headers.location;
				res.set(response.headers);
				res.redirect(location);
			} else if (response.status) {
				res.set(response.headers);
				res.status(response.status).send(response.body);
			} else {
				next();
			}
		};

		// Transforms requests which are POST and aren't "x-www-form-urlencoded" content type
		// and they pass the required information as query strings
		const transformRequestsNotUsingFormUrlencodedType = function (req: Request, _res: Response, next: NextFunction) {
			if (!req.is('application/x-www-form-urlencoded') && req.method === 'POST') {
				if (config.debug === true) {
					console.log('[OAuth2Server]', 'Transforming a request to form-urlencoded with the query going to the body.');
				}
				req.headers['content-type'] = 'application/x-www-form-urlencoded';
				req.body = Object.assign({}, req.body, req.query);
			}
			return next();
		};

		this.app.all('/oauth/token', debugMiddleware, transformRequestsNotUsingFormUrlencodedType, async (req, res, next) => {
			const request = new OAuthServer.Request(req);
			const response = new OAuthServer.Response(res);

			try {
				await oauth.token(request, response);

				handleResponse(res, response, next);
			} catch (e: any) {
				next(e);
			}
		});

		this.app.get('/oauth/authorize', debugMiddleware, async (req, res, next) => {
			if (typeof req.query.client_id !== 'string') {
				return res.redirect('/oauth/error/404');
			}

			const client = await OAuthApps.findOneActiveByClientId(req.query.client_id);
			if (client == null) {
				return res.redirect('/oauth/error/404');
			}

			const redirectUris: string[] = client.redirectUri.split(',');

			if (typeof req.query.redirect_uri === 'string' && !redirectUris.includes(req.query.redirect_uri)) {
				return res.redirect('/oauth/error/invalid_redirect_uri');
			}

			return next();
		});

		this.app.post('/oauth/authorize', debugMiddleware, async (req, res, next) => {
			if (req.body.allow !== 'yes') {
				res.status(401);
				return res.send({ error: 'access_denied', error_description: 'The user denied access to your application' });
			}

			// The new version of the library is expecting a new name. Doing this for compatibility
			if (req.body.token && !req.body.access_token) {
				req.body.access_token = req.body.token;
			}

			if (req.body.access_token == null) {
				return res.status(401).send('No token');
			}

			const user = await Users.findOne(
				{
					'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(req.body.access_token),
				},
				{ projection: { _id: 1 } },
			);

			if (user == null) {
				return res.status(401).send('Invalid token');
			}

			res.locals.user = { id: user._id };

			return next();
		});

		this.app.post('/oauth/authorize', debugMiddleware, async (req: Request, res: Response, next: NextFunction) => {
			const request = new OAuthServer.Request(req);
			const response = new OAuthServer.Response(res);

			try {
				await oauth.authorize(request, response, {
					authenticateHandler: {
						async handle() {
							const clientId = request.body.client_id || request.query?.client_id;

							if (!clientId) {
								throw new Error('Missing parameter: `client_id`');
							}

							if (req.body.allow === 'yes') {
								await Users.updateOne({ _id: res.locals.user.id }, { $addToSet: { 'oauth.authorizedClients': clientId } });
							}
							return { id: res.locals.user.id };
						},
					},
				});

				handleResponse(res, response, next);
			} catch (e: any) {
				next(e);
			}
		});

		this.app.use('/oauth/*', (err: Error, _req: Request, res: Response, next: NextFunction) => {
			if (!(err instanceof OAuthError)) return next(err);

			delete err.stack;

			res.status(err.code);

			if (err instanceof UnauthorizedRequestError) {
				return res.send();
			}

			res.send({ error: err.name, error_description: err.message });
		});
	}
}
