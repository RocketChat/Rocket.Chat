import { LDAP } from '@rocket.chat/core-services';
import type { IUser, OAuthConfiguration } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import { isAbsoluteURL } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';
import type { DoneCallback } from 'passport';
import type { VerifyFunction, StrategyOptions } from 'passport-oauth2';
import { Strategy } from 'passport-oauth2';

import { normalizers, fromTemplate, renameInvalidProperties } from './transform_helpers';
import { client } from '../../../server/database/utils';
import { callbacks } from '../../../server/lib/callbacks';
import { saveUserIdentity } from '../../lib/server/functions/saveUserIdentity';
import { notifyOnUserChange } from '../../lib/server/lib/notifyListener';
import { settings } from '../../settings/server/cached';

const logger = new Logger('CustomOAuth');
const BeforeUpdateOrCreateUserFromExternalService: ((serviceName: string, serviceData: Record<string, any>) => Promise<void>)[] = [];

export class CustomOAuthStrategy extends Strategy {
	options: StrategyOptions;

	config: OAuthConfiguration & { clientSecret: string };

	identityPath: string;

	emailPath: string;

	tokenSentVia: string;

	identityTokenSentVia: string;

	keyField: string;

	usernameField: string;

	emailField: string;

	nameField: string;

	avatarField: string;

	mergeUsers: boolean;

	mergeUsersDistinctServices: boolean;

	rolesClaim: string;

	accessTokenParam: string;

	serverURL: string;

	tokenPath: string;

	constructor(name: string, config: OAuthConfiguration & { clientSecret: string }, verify: VerifyFunction) {
		if (!config.serverURL || typeof config.serverURL !== 'string') {
			throw new Meteor.Error('customOAuth: serverURL is required and must be String');
		}

		const options: StrategyOptions = {
			authorizationURL: config.serverURL + config.authorizePath,
			tokenURL: config.serverURL + config.tokenPath,
			clientID: config.clientId,
			clientSecret: config.clientSecret,
			callbackURL: `${settings.get<string>('Site_Url')}/_oauth/${name}`,
			state: true,
			pkce: config.pkce ?? true,
			scope: config.scope,
		};

		super(options, verify);

		this.serverURL = config.serverURL;
		this.tokenPath = config.tokenPath || '/oauth/token';
		this.identityPath = config.identityPath || '/me';
		this.tokenSentVia = config.tokenSentVia;
		this.identityTokenSentVia = config.identityTokenSentVia;
		this.keyField = config.keyField;
		this.usernameField = config.usernameField?.trim();
		this.emailField = config.emailField?.trim();
		this.nameField = config.nameField?.trim();
		this.avatarField = config.avatarField?.trim();
		this.mergeUsers = !!config.mergeUsers;
		this.mergeUsersDistinctServices = !!config.mergeUsersDistinctServices;
		this.rolesClaim = config.rolesClaim || 'roles';
		this.accessTokenParam = config.accessTokenParam || 'access_token';

		if (this.identityTokenSentVia == null || this.identityTokenSentVia === 'default') {
			this.identityTokenSentVia = this.tokenSentVia;
		}

		if (!isAbsoluteURL(this.tokenPath)) {
			this.tokenPath = this.serverURL + this.tokenPath;
		}

		if (!isAbsoluteURL(this.identityPath)) {
			this.identityPath = this.serverURL + this.identityPath;
		}

		if (this.emailPath && !isAbsoluteURL(this.emailPath)) {
			this.emailPath = this.serverURL + this.emailPath;
		}

		if (config.tokenSentVia === 'header') {
			this._oauth2.useAuthorizationHeaderforGET(true);
		}

		if (config.accessTokenParam && config.accessTokenParam !== 'access_token') {
			this._oauth2.setAccessTokenName(config.accessTokenParam);
		}

		if (config.addAutopublishFields && typeof config.addAutopublishFields === 'object') {
			Accounts.addAutopublishFields(config.addAutopublishFields);
		}

		this.name = name;
		this.options = options;
		this.config = config;

		this.addHookToProcessUser();
	}

	getUsername(data: Record<string, any>) {
		try {
			const value = fromTemplate(this.usernameField, data);

			if (!value) {
				logger.debug({ msg: 'Username field not found in data', usernameField: this.usernameField, data });
				throw new Meteor.Error('field_not_found', `Username field "${this.usernameField}" not found in data`);
			}

			return value as string;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract username', { cause: error });
		}
	}

	getEmail(data: Record<string, any>) {
		try {
			const value = fromTemplate(this.emailField, data);

			if (!value) {
				logger.debug({ msg: 'Email field not found in data', emailField: this.emailField, data });
				throw new Meteor.Error('field_not_found', `Email field "${this.emailField}" not found in data`);
			}
			return value as string;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract email', { cause: error });
		}
	}

	getCustomName(data: Record<string, any>) {
		try {
			const value = fromTemplate(this.nameField, data);

			if (!value) {
				return this.getName(data);
			}

			return value as string;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract custom name', { cause: error });
		}
	}

	getAvatarUrl(data: Record<string, any>) {
		try {
			const value = fromTemplate(this.avatarField, data);

			if (!value) {
				logger.debug({ msg: 'Avatar field not found in data', avatarField: this.avatarField, data });
			}
			return value as string;
		} catch (error) {
			throw new Error('CustomOAuth: Failed to extract avatar url', { cause: error });
		}
	}

	getName(identity: Record<string, any>): string {
		const name = (identity.name ||
			identity.username ||
			identity.nickname ||
			identity.CharacterName ||
			identity.userName ||
			identity.preferred_username ||
			identity.user?.name) as string;
		return name;
	}

	normalizeIdentity(identity: Record<string, any>) {
		if (identity) {
			for (const normalizer of Object.values(normalizers)) {
				const result = normalizer(identity);
				if (result) {
					identity = result;
				}
			}
		}

		if (this.usernameField) {
			identity.username = this.getUsername(identity);
		}

		if (this.emailField) {
			identity.email = this.getEmail(identity);
		}

		if (this.avatarField) {
			identity.avatarUrl = this.getAvatarUrl(identity);
		}

		if (this.nameField) {
			identity.name = this.getCustomName(identity);
		} else {
			identity.name = this.getName(identity);
		}

		return renameInvalidProperties(identity);
	}

	override userProfile(accessToken: string, done: DoneCallback) {
		if (!this.identityPath) {
			return done(new Error(`identityPath is required for ${this.name} custom oauth`));
		}

		this._oauth2.get(this.identityPath, accessToken, (err, body, res) => {
			if (err) {
				return done(err);
			}

			if ((res && res.statusCode !== 200) || !body) {
				return done(new Error(`Failed to fetch identity from ${this.name} at ${this.identityPath}}`));
			}

			try {
				const result = JSON.parse(typeof body === 'string' ? body : body.toString());
				const normalizedIdentity = this.normalizeIdentity(result);
				//Nextcloud URL needed on addWebdavServer
				normalizedIdentity.serverURL = this.serverURL;
				return done(null, normalizedIdentity);
			} catch (e) {
				return done(new Error(`Failed to parse identity from ${this.name} at ${this.identityPath}. ${e}`));
			}
		});
	}

	addHookToProcessUser() {
		BeforeUpdateOrCreateUserFromExternalService.push(async (serviceName, serviceData) => {
			if (serviceName !== this.name) {
				return;
			}

			if (serviceData.username) {
				let user: IUser | null = null;

				if (this.keyField === 'username') {
					user = this.mergeUsersDistinctServices
						? await Users.findOneByUsernameIgnoringCase(serviceData.username)
						: await Users.findOneByUsernameAndServiceNameIgnoringCase(serviceData.username, serviceData.id, serviceName);
				} else if (this.keyField === 'email') {
					user = this.mergeUsersDistinctServices
						? await Users.findOneByEmailAddress(serviceData.email)
						: await Users.findOneByEmailAddressAndServiceNameIgnoringCase(serviceData.email, serviceData.id, serviceName);
				}

				if (!user) {
					return;
				}

				await callbacks.run('afterProcessOAuthUser', { serviceName, serviceData, user });
				// User already created or merged and has identical name as before
				if (
					user.services?.[serviceName as keyof NonNullable<IUser['services']>] &&
					user.services[serviceName as keyof NonNullable<IUser['services']>].id === serviceData.id &&
					user.name === serviceData.name &&
					(this.keyField === 'email' || !serviceData.email || user.emails?.find(({ address }) => address === serviceData.email))
				) {
					return;
				}

				if (this.mergeUsers !== true) {
					throw new Meteor.Error('CustomOAuth', `User with username ${user.username} already exists`);
				}

				const serviceIdKey = `services.${serviceName}.id`;
				const successCallbacks = [
					async () => {
						const updatedUser = await Users.findOneById(user._id, { projection: { name: 1, emails: 1, [serviceIdKey]: 1 } });
						if (updatedUser) {
							const { _id, ...diff } = updatedUser;
							void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff });
						}
					},
				];

				const session = client.startSession();
				try {
					// Extend the session to match the ExtendedSession type expected by saveUserIdentity
					Object.assign(session, {
						onceSuccesfulCommit: (cb: () => Promise<void>) => {
							successCallbacks.push(cb);
						},
					});

					session.startTransaction();

					const updater = Users.getUpdater();

					if (this.keyField === 'username' && serviceData.email) {
						updater.set('emails', [{ address: serviceData.email, verified: true }]);
					}

					updater.set(serviceIdKey as keyof IUser['services'], serviceData.id);

					await saveUserIdentity({
						_id: user._id,
						name: serviceData.name,
						updater,
						session,
						updateUsernameInBackground: true,
						// Username needs to be included otherwise the name won't be updated in some collections
						username: user.username,
					});
					await Users.updateFromUpdater({ _id: user._id }, updater, { session });

					await session.commitTransaction();
				} catch (e) {
					await session.abortTransaction();
					throw e;
				} finally {
					await session.endSession();
				}

				void Promise.allSettled(successCallbacks.map((cb) => cb()));
			}
		});

		Accounts.validateNewUser((user: IUser & { email: string }) => {
			if (!user.services?.[this.name as keyof NonNullable<IUser['services']>]?.id) {
				return true;
			}

			if (this.usernameField) {
				user.username = user.services[this.name as keyof NonNullable<IUser['services']>].username;
			}

			if (this.emailField) {
				user.email = user.services[this.name as keyof NonNullable<IUser['services']>].email;
			}

			if (this.nameField) {
				user.name = user.services[this.name as keyof NonNullable<IUser['services']>].name;
			}

			return true;
		});
	}
}

const { updateOrCreateUserFromExternalService } = Accounts;

Accounts.updateOrCreateUserFromExternalService = async function (...args) {
	for (const hook of BeforeUpdateOrCreateUserFromExternalService) {
		await hook.apply(this, args as unknown as [string, Record<string, any>]);
	}

	const [serviceName, serviceData] = args;

	const user = await updateOrCreateUserFromExternalService.apply(this, args);

	if (!user?.userId) {
		return undefined;
	}

	const fullUser = await Users.findOneById(user.userId as string);

	if (!fullUser) {
		return undefined;
	}

	if (settings.get('LDAP_Update_Data_On_OAuth_Login') && fullUser.username) {
		await LDAP.loginAuthenticatedUserRequest(fullUser.username);
	}

	await callbacks.run('afterValidateNewOAuthUser', {
		identity: serviceData,
		serviceName,
		user: fullUser,
	});

	return user;
};
