import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';
import type { Profile, DoneCallback } from 'passport';

import { CustomOAuthStrategy } from './passport/CustomOAuthStrategy';
import type { CustomOAuthProfile, OAuthServiceConfig } from './passport/types';
import { processOAuthUser } from './processOAuthUser';
import { oAuthRouter } from '../../configuration/configurePassport';

const logger = new Logger('configureOAuthServices');

const configuredProviders = new Set<string>();

export const configureOAuthServices = (oauthServiceConfig: OAuthServiceConfig[]) => {
	oauthServiceConfig.forEach((config) => {
		if (configuredProviders.has(config.provider)) {
			try {
				passport.unuse(config.provider);
			} catch (e) {
				// Strategy may not exist, ignore
			}
		}

		if (config.custom) {
			configureCustomOAuthService(config);
		} else {
			configureBuiltInOAuthService(config);
		}

		configuredProviders.add(config.provider);
	});
};

const configureBuiltInOAuthService = (config: OAuthServiceConfig) => {
	const Strategy = config.strategy;
	const callbackURL = `${Meteor.absoluteUrl()}oauth/${config.provider}/callback`;

	passport.use(
		config.provider,
		new Strategy(
			{
				clientID: config.clientId,
				clientSecret: config.clientSecret,
				callbackURL,
				scope: config.scope,
				state: true,
				pkce: true,
			},
			(accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) => {
				logger.debug({ msg: 'OAuth profile received', provider: config.provider, profile });
				return done(null, {
					provider: config.provider,
					providerId: profile.id,
					email: profile?.emails?.[0]?.value,
					name: profile.displayName,
					username: profile.username,
					avatarUrl: profile.photos?.[0]?.value,
					accessToken,
					refreshToken,
				});
			},
		),
	);

	registerOAuthRoutes(config.provider, config.scope);
};

const configureCustomOAuthService = (config: OAuthServiceConfig) => {
	if (!config.customOptions?.serverURL) {
		logger.warn({ msg: 'Custom OAuth service missing serverURL', provider: config.provider });
		return;
	}

	const callbackURL = `${Meteor.absoluteUrl()}oauth/${config.provider}/callback`;

	const strategy = new CustomOAuthStrategy(
		config.provider,
		{
			...config.customOptions,
			clientID: config.clientId,
			clientSecret: config.clientSecret,
			callbackURL,
		},
		(accessToken: string, refreshToken: string, profile: CustomOAuthProfile, done: DoneCallback) => {
			logger.debug({ msg: 'Custom OAuth profile received', provider: config.provider, profile });
			return done(null, profile);
		},
	);

	passport.use(config.provider, strategy);

	registerOAuthRoutes(config.provider, config.scope, config.customOptions);
};

const registerOAuthRoutes = (
	provider: string,
	scope: string | string[] | undefined,
	customOptions?: OAuthServiceConfig['customOptions'],
) => {
	const authOptions: passport.AuthenticateOptions = {
		failureRedirect: '/login',
	};

	if (scope) {
		authOptions.scope = Array.isArray(scope) ? scope : scope.split(/[\s,]+/).filter(Boolean);
	}

	oAuthRouter.get(`/oauth/${provider}`, passport.authenticate(provider, authOptions));

	oAuthRouter.get(`/oauth/${provider}/callback`, passport.authenticate(provider, { failureRedirect: '/login' }), async (req, res) => {
		const oAuthUser = req.user as CustomOAuthProfile | undefined;

		if (!oAuthUser) {
			logger.warn({ msg: 'OAuth callback without user', provider });
			return res.redirect('/login');
		}

		logger.debug({ msg: 'OAuth callback received', provider, oAuthUser });

		try {
			const serviceData: Record<string, unknown> = {
				id: oAuthUser.providerId || oAuthUser.id,
				accessToken: oAuthUser.accessToken,
				refreshToken: oAuthUser.refreshToken,
				expiresAt: oAuthUser.expiresAt,
				email: oAuthUser.email,
				username: oAuthUser.username,
				name: oAuthUser.name,
				avatarUrl: oAuthUser.avatarUrl,
			};

			if (customOptions) {
				serviceData._OAuthCustom = true;
				serviceData.serverURL = customOptions.serverURL;
				if (oAuthUser.idToken) {
					serviceData.idToken = oAuthUser.idToken;
				}

				Object.keys(oAuthUser).forEach((key) => {
					if (!(key in serviceData) && key !== 'provider' && key !== 'providerId') {
						serviceData[key] = oAuthUser[key as keyof CustomOAuthProfile];
					}
				});
			}

			if (customOptions) {
				await processOAuthUser(provider, serviceData, customOptions);
			}

			const user = await Accounts.updateOrCreateUserFromExternalService(provider, serviceData, {
				profile: {
					name: oAuthUser.name,
				},
			});

			if (!user?.userId) {
				logger.warn({ msg: 'OAuth user creation failed', provider });
				return res.redirect('/login');
			}

			const userFromDB = await Users.findOneById(user.userId);
			logger.debug({ msg: 'OAuth user found/created', provider, userId: user.userId });

			const stampedToken = Accounts._generateStampedLoginToken();
			Accounts._insertLoginToken(userFromDB?._id as string, stampedToken);

			const redirectUrl = `${Meteor.absoluteUrl()}home?resumeToken=${stampedToken.token}`;
			res.redirect(redirectUrl);

			req.session.destroy((err) => {
				if (err) {
					logger.error({ msg: 'Error destroying session', error: err });
				}
			});
		} catch (error) {
			logger.error({ msg: 'OAuth callback error', provider, error });
			return res.redirect('/login');
		}
	});
};
