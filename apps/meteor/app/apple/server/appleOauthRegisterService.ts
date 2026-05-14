import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';
import passport from 'passport';
import { Strategy as AppleStrategy } from 'passport-apple';
import type { Profile } from 'passport-apple';

import { AppleCustomOAuth } from './AppleCustomOAuth';
import { oAuthRouter } from '../../../server/configuration/configurePassport';
import { settings } from '../../settings/server';
import { config } from '../lib/config';
import { handleIdentityToken } from '../lib/handleIdentityToken';

new AppleCustomOAuth('apple', config);

settings.watchMultiple(
	[
		'Accounts_OAuth_Apple',
		'Accounts_OAuth_Apple_id',
		'Accounts_OAuth_Apple_secretKey',
		'Accounts_OAuth_Apple_iss',
		'Accounts_OAuth_Apple_kid',
	],
	async ([enabled, clientId, serverSecret, iss, kid]) => {
		if (!enabled) {
			passport.unuse('apple');
			return ServiceConfiguration.configurations.removeAsync({
				service: 'apple',
			});
		}

		// if everything is empty but Apple login is enabled, don't show the login button
		if (!clientId && !serverSecret && !iss && !kid) {
			await ServiceConfiguration.configurations.upsertAsync(
				{
					service: 'apple',
				},
				{
					$set: {
						showButton: false,
						enabled: settings.get('Accounts_OAuth_Apple'),
					},
				},
			);
			return;
		}

		passport.unuse('apple');

		const callbackURL = `${settings.get<string>('Site_Url')}/oauth/apple/callback`;
		console.log('CALLBACK URL -> ', callbackURL);
		passport.use(
			'apple',
			new AppleStrategy(
				{
					clientID: settings.get<string>('Accounts_OAuth_Apple_id'),
					teamID: settings.get<string>('Accounts_OAuth_Apple_iss'),
					keyID: settings.get<string>('Accounts_OAuth_Apple_kid'),
					privateKeyString: settings.get<string>('Accounts_OAuth_Apple_secretKey').replace(/\\n/g, '\n'),
					callbackURL,
					scope: ['name', 'email'],
					passReqToCallback: false,
					state: true,
				},
				async (accessToken: string, refreshToken: string, idToken: string, profile: Profile, done) => {
					console.log('profile', profile);
					console.log('idToken', idToken);

					try {
						const serviceData = await handleIdentityToken(idToken);
						console.log('serviceData', serviceData);
						if (profile?.name) {
							serviceData.name = `${profile.name.firstName}${profile.name.middleName ? ` ${profile.name.middleName}` : ''}${
								profile.name.lastName ? ` ${profile.name.lastName}` : ''
							}`;
						}

						if (!serviceData.email && profile?.email) {
							serviceData.email = profile.email;
						}

						// eslint-disable-next-line @typescript-eslint/await-thenable
						const user = await Accounts.updateOrCreateUserFromExternalService(
							'apple',
							{
								accessToken,
								refreshToken,
								...serviceData,
							},
							{},
						);

						if (!user?.userId || typeof user?.userId !== 'string') {
							return done(new Error('User not found'));
						}

						const userFromDB = await Users.findOneById(user.userId);

						if (!userFromDB) {
							return done(new Error('User not found'));
						}

						return done(null, userFromDB);
					} catch (error: any) {
						done(error);
						return {
							type: 'apple',
							error: new MeteorError(Accounts.LoginCancelledError.numericError, error.message),
						};
					}
				},
			),
		);

		const callbackHandler = [
			(req: Request, _res: Response, next: NextFunction) => {
				console.log('2nd callback url');
				console.log('query -> ', req.query);
				console.log('req in 2nd callback ->', req.session);
				console.log('req cookies in 2nd callback -> ', req.headers.cookie);
				next();
			},
			passport.authenticate('apple', { failureRedirect: '/login', failureFlash: true, failWithError: true }),
			async (req: Request, res: Response) => {
				console.log('req -> user', req.user);
				const oAuthUser = req.user as IUser;

				if (!oAuthUser) {
					return res.redirect('/noOauthUser');
				}

				const stampedToken = Accounts._generateStampedLoginToken();
				await Accounts._insertLoginToken(oAuthUser._id, stampedToken);

				res.redirect(`/home?resumeToken=${stampedToken.token}`);

				req.session.destroy((err) => {
					if (err) {
						console.error('Error destroying session', err);
					}
				});
			},
		];

		oAuthRouter.get(
			'/oauth/apple',
			passport.authenticate('apple', { scope: ['name', 'email'], prompt: 'consent', failureRedirect: '/login' }),
			(req: Request, _res: Response, next: NextFunction) => {
				console.log('req in 1st callback ->', req.session);
				next();
			},
		);

		// oAuthRouter.route('/oauth/apple/callback').post(...callbackHandler);

		// Apple is different in that they POST back to the callback.
		// Because of SameSite policies in browsers don't allow cookies to be included in external POST requests
		// we wouldn't be able to access our express session here, and thereby not authenticate the session.
		// Therefore we redirect the POST request to GET (with query parameters).
		// https://github.com/ananay/passport-apple/issues/51#issuecomment-2312651378
		oAuthRouter.post('/oauth/apple/callback', express.urlencoded({ extended: true }), (req, res) => {
			const { body } = req;
			const sp = new URLSearchParams();
			Object.entries(body).forEach(([key, value]) => sp.set(key, String(value)));
			console.log('apple callback search params - ', sp.toString());
			res.redirect(`/oauth/apple/callback?${sp.toString()}`);
		});

		// Here we handle the GET request after the redirect from the POST callback above
		// oAuthRouter.get(
		// 	'/oauth/apple/callback',
		// 	passport.authenticate('apple', {
		// 		successReturnToOrRedirect: '/success',
		// 		failureRedirect: '/login',
		// 	}),
		// 	async (err, _req, res, _next) => {
		// 		// for some reason, `failureRedirect` doesn't receive certain errors, so we need an error handler here.
		// 		if (err instanceof Error && (err.name === 'AuthorizationError' || err.name === 'TokenError')) {
		// 			// Common errors:
		// 			// - AuthorizationError { code: 'user_cancelled_authorize' } - When the user cancels the operation
		// 			// - TokenError { code: 'invalid_grant' } - The code has already been used
		// 			console.log('ERROR - ', err);
		// 			const sp = new URLSearchParams({ error: err.name });
		// 			if ('code' in err && typeof err.code === 'string') {
		// 				sp.set('code', err.code);
		// 			}
		// 			res.redirect(`${'/login'}${sp.toString()}`);
		// 			return;
		// 		}

		// 		// unknown err object
		// 		res.redirect('/login');
		// 	},
		// );
		oAuthRouter.get('/oauth/apple/callback', ...callbackHandler);
	},
);
