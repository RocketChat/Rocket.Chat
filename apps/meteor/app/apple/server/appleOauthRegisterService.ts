import { MeteorError } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import express from 'express';
import { Accounts } from 'meteor/accounts-base';
import { ServiceConfiguration } from 'meteor/service-configuration';
import passport from 'passport';
import { Strategy as AppleStrategy } from 'passport-apple';
import type { Profile } from 'passport-apple';

import { AppleCustomOAuth } from './AppleCustomOAuth';
import { oAuthRouter } from '../../../server/configuration/configurePassport';
import { passportOAuthCallback } from '../../../server/lib/oauth/passportOAuthCallback';
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

		passport.use(
			'apple',

			new AppleStrategy(
				{
					clientID: settings.get<string>('Accounts_OAuth_Apple_id'),
					teamID: settings.get<string>('Accounts_OAuth_Apple_iss'),
					keyID: settings.get<string>('Accounts_OAuth_Apple_kid'),
					privateKeyString: settings.get<string>('Accounts_OAuth_Apple_secretKey').replace(/\\n/g, '\n'),
					callbackURL: `${settings.get<string>('Site_Url')}/_oauth/apple`,
					scope: ['name', 'email'],
					passReqToCallback: false,
					state: false,
				},
				async (accessToken: string, refreshToken: string, idToken: string, profile: Profile, done) => {
					try {
						const serviceData = await handleIdentityToken(idToken);
						if (profile?.name) {
							serviceData.name = `${profile.name.firstName}${profile.name.middleName ? ` ${profile.name.middleName}` : ''}${
								profile.name.lastName ? ` ${profile.name.lastName}` : ''
							}`;
						}

						if (!serviceData.email && profile?.email) {
							serviceData.email = profile.email;
						}

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
			express.urlencoded({ extended: true }),
			passport.authenticate('apple', { failWithError: true, session: true, keepSessionInfo: true }),
			passportOAuthCallback(settings.get<string>('Site_Url')),
		];

		oAuthRouter.get(
			'/oauth/apple',
			(req, _res, next) => {
				const { loginClient } = req.query;
				if (loginClient === 'mobile' || loginClient === 'desktop') {
					req.session.loginClient = loginClient;
					req.session.save(() => {
						next();
					});
				} else {
					//delete stale value from previous sessions if any
					delete req.session.loginClient;
					next();
				}
			},
			passport.authenticate('apple', {
				scope: ['name', 'email'],
			}),
		);

		oAuthRouter
			.route('/_oauth/apple')
			.post(...callbackHandler)
			.get(...callbackHandler);
	},
);
