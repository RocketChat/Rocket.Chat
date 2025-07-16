import type { ServerResponse } from 'http';

import type { IUser, IIncomingMessage, IPersonalAccessToken } from '@rocket.chat/core-typings';
import { CredentialTokens, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { escapeRegExp, escapeHTML } from '@rocket.chat/string-helpers';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { SAMLServiceProvider } from './ServiceProvider';
import { SAMLUtils } from './Utils';
import { ensureArray } from '../../../../lib/utils/arrayUtils';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';
import { createRoom } from '../../../lib/server/functions/createRoom';
import { generateUsernameSuggestion } from '../../../lib/server/functions/getUsernameSuggestion';
import { saveUserIdentity } from '../../../lib/server/functions/saveUserIdentity';
import { settings } from '../../../settings/server';
import { i18n } from '../../../utils/lib/i18n';
import type { ISAMLAction } from '../definition/ISAMLAction';
import type { ISAMLUser } from '../definition/ISAMLUser';
import type { IServiceProviderOptions } from '../definition/IServiceProviderOptions';

const showErrorMessage = function (res: ServerResponse, err: string): void {
	res.writeHead(200, {
		'Content-Type': 'text/html',
	});
	const content = `<html><body><h2>Sorry, an annoying error occured</h2><div>${escapeHTML(err)}</div></body></html>`;
	res.end(content, 'utf-8');
};

export class SAML {
	public static async processRequest(
		req: IIncomingMessage,
		res: ServerResponse,
		service: IServiceProviderOptions,
		samlObject: ISAMLAction,
	): Promise<void> {
		// Skip everything if there's no service set by the saml middleware
		if (!service) {
			if (samlObject.actionName === 'metadata') {
				showErrorMessage(res, `Unexpected SAML service ${samlObject.serviceName}`);
				return;
			}

			throw new Error(`Unexpected SAML service ${samlObject.serviceName}`);
		}

		switch (samlObject.actionName) {
			case 'metadata':
				return this.processMetadataAction(res, service);
			case 'logout':
				return this.processLogoutAction(req, res, service);
			case 'sloRedirect':
				return this.processSLORedirectAction(req, res);
			case 'authorize':
				return this.processAuthorizeAction(res, service, samlObject);
			case 'validate':
				return this.processValidateAction(req, res, service, samlObject);
			default:
				throw new Error(`Unexpected SAML action ${samlObject.actionName}`);
		}
	}

	public static async hasCredential(credentialToken: string): Promise<boolean> {
		return (await CredentialTokens.findOneNotExpiredById(credentialToken)) != null;
	}

	public static async retrieveCredential(credentialToken: string): Promise<Record<string, any> | undefined> {
		// The credentialToken in all these functions corresponds to SAMLs inResponseTo field and is mandatory to check.
		const data = await CredentialTokens.findOneNotExpiredById(credentialToken);
		if (data) {
			return data.userInfo;
		}
	}

	public static async storeCredential(credentialToken: string, loginResult: { profile: Record<string, any> }): Promise<void> {
		await CredentialTokens.create(credentialToken, loginResult);
	}

	public static async insertOrUpdateSAMLUser(userObject: ISAMLUser): Promise<{ userId: string; token: string }> {
		const {
			generateUsername,
			immutableProperty,
			nameOverwrite,
			mailOverwrite,
			channelsAttributeUpdate,
			defaultUserRole = 'user',
		} = SAMLUtils.globalSettings;

		let customIdentifierMatch = false;
		let customIdentifierAttributeName: string | null = null;
		let user = null;

		// First, try searching by custom identifier
		if (
			userObject.identifier.type === 'custom' &&
			userObject.identifier.attribute &&
			userObject.attributeList.has(userObject.identifier.attribute)
		) {
			customIdentifierAttributeName = userObject.identifier.attribute;

			const query: Record<string, any> = {};
			query[`services.saml.${customIdentifierAttributeName}`] = userObject.attributeList.get(customIdentifierAttributeName);
			user = await Users.findOne(query);

			if (user) {
				customIdentifierMatch = true;
			}
		}

		// Second, try searching by username or email (according to the immutableProperty setting)
		if (!user) {
			const expression = userObject.emailList.map((email) => `^${escapeRegExp(email)}$`).join('|');
			const emailRegex = new RegExp(expression, 'i');

			user = await SAML.findUser(userObject.username, emailRegex);
		}

		const emails = userObject.emailList.map((email) => ({
			address: email,
			verified: settings.get('Accounts_Verify_Email_For_External_Accounts'),
		}));

		let { username } = userObject;
		const { fullName } = userObject;

		const active = !settings.get('Accounts_ManuallyApproveNewUsers');

		if (!user) {
			// If we received any role from the mapping, use them - otherwise use the default role for creation.
			const roles = userObject.roles?.length ? userObject.roles : ensureArray<string>(defaultUserRole.split(','));

			const newUser: Record<string, any> = {
				name: fullName,
				active,
				globalRoles: roles,
				emails,
				services: {
					saml: {
						provider: userObject.samlLogin.provider,
						idp: userObject.samlLogin.idp,
					},
				},
			};

			if (customIdentifierAttributeName) {
				newUser.services.saml[customIdentifierAttributeName] = userObject.attributeList.get(customIdentifierAttributeName);
			}

			if (generateUsername === true) {
				username = await generateUsernameSuggestion(newUser);
			}

			if (username) {
				newUser.username = username;
				newUser.name = newUser.name || SAML.guessNameFromUsername(username);
			}

			if (userObject.language) {
				if (i18n.languages?.includes(userObject.language)) {
					newUser.language = userObject.language;
				}
			}

			const userId = await Accounts.insertUserDoc({}, newUser);
			user = await Users.findOneById(userId);

			if (user && userObject.channels && channelsAttributeUpdate !== true) {
				await SAML.subscribeToSAMLChannels(userObject.channels, user);
			}
		}

		if (!user) {
			throw new Error('Failed to create user');
		}
		// creating the token and adding to the user
		const stampedToken = Accounts._generateStampedLoginToken();
		await Users.addPersonalAccessTokenToUser({
			userId: user._id,
			loginTokenObject: stampedToken as unknown as IPersonalAccessToken,
		});

		const updateData: Record<string, any> = {
			'services.saml.provider': userObject.samlLogin.provider,
			'services.saml.idp': userObject.samlLogin.idp,
			'services.saml.idpSession': userObject.samlLogin.idpSession,
			'services.saml.nameID': userObject.samlLogin.nameID,
		};

		// If the user was not found through the customIdentifier property, then update it's value
		if (customIdentifierMatch === false && customIdentifierAttributeName) {
			updateData[`services.saml.${customIdentifierAttributeName}`] = userObject.attributeList.get(customIdentifierAttributeName);
		}

		// Overwrite mail if needed
		if (mailOverwrite === true && (customIdentifierMatch === true || immutableProperty !== 'EMail')) {
			updateData.emails = emails;
		}

		// When updating an user, we only update the roles if we received them from the mapping
		if (userObject.roles?.length) {
			updateData.roles = userObject.roles;
		}

		if (userObject.channels && channelsAttributeUpdate === true) {
			await SAML.subscribeToSAMLChannels(userObject.channels, user);
		}

		await Users.updateOne(
			{
				_id: user._id,
			},
			{
				$set: updateData,
			},
		);

		if ((username && username !== user.username) || (nameOverwrite && fullName && fullName !== user.name)) {
			await saveUserIdentity({ _id: user._id, name: nameOverwrite ? fullName || undefined : user.name, username });
		}

		// sending token along with the userId
		return {
			userId: user._id,
			token: stampedToken.token,
		};
	}

	private static processMetadataAction(res: ServerResponse, service: IServiceProviderOptions): void {
		try {
			const serviceProvider = new SAMLServiceProvider(service);

			res.writeHead(200);
			res.write(serviceProvider.generateServiceProviderMetadata());
			res.end();
		} catch (err: any) {
			showErrorMessage(res, err);
		}
	}

	private static async processLogoutAction(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions): Promise<void> {
		// This is where we receive SAML LogoutResponse
		if (req.query.SAMLRequest) {
			return this.processLogoutRequest(req, res, service);
		}

		return this.processLogoutResponse(req, res, service);
	}

	private static async _logoutRemoveTokens(userId: string): Promise<void> {
		SAMLUtils.log(`Found user ${userId}`);

		await Users.unsetLoginTokens(userId);
		await Users.removeSamlServiceSession(userId);
	}

	private static async processLogoutRequest(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions): Promise<void> {
		const serviceProvider = new SAMLServiceProvider(service);
		await serviceProvider.validateLogoutRequest(req.query.SAMLRequest, async (err, result) => {
			if (err) {
				SystemLogger.error({ err });
				throw new Meteor.Error('Unable to Validate Logout Request');
			}

			if (!result?.nameID || !result?.idpSession) {
				throw new Meteor.Error('Unable to process Logout Request: missing request data.');
			}

			let timeoutHandler: NodeJS.Timeout | undefined = undefined;
			const redirect = (url?: string | undefined): void => {
				if (!timeoutHandler) {
					// If the handler is null, then we already ended the response;
					return;
				}

				clearTimeout(timeoutHandler);
				timeoutHandler = undefined;

				res.writeHead(302, {
					Location: url || Meteor.absoluteUrl(),
				});
				res.end();
			};

			// Add a timeout to end the server response
			timeoutHandler = setTimeout(() => {
				// If we couldn't get a valid IdP url, let's redirect the user to our home so the browser doesn't hang on them.
				redirect();
			}, 5000);

			try {
				const loggedOutUsers = await Users.findBySAMLNameIdOrIdpSession(result.nameID, result.idpSession).toArray();
				if (loggedOutUsers.length > 1) {
					throw new Meteor.Error('Found multiple users matching SAML session');
				}

				if (loggedOutUsers.length === 0) {
					throw new Meteor.Error('Invalid logout request: no user associated with session.');
				}

				await this._logoutRemoveTokens(loggedOutUsers[0]._id);

				const { response } = serviceProvider.generateLogoutResponse({
					nameID: result.nameID || '',
					sessionIndex: result.idpSession || '',
					inResponseToId: result.id || '',
				});

				serviceProvider.logoutResponseToUrl(response, (err, url) => {
					if (err) {
						SystemLogger.error({ err });
						return redirect();
					}

					redirect(url);
				});
			} catch (e: any) {
				SystemLogger.error(e);
				redirect();
			}
		});
	}

	private static async processLogoutResponse(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions): Promise<void> {
		if (!req.query.SAMLResponse) {
			SAMLUtils.error('Invalid LogoutResponse, missing SAMLResponse', req.query);
			throw new Error('Invalid LogoutResponse received.');
		}

		const serviceProvider = new SAMLServiceProvider(service);
		await serviceProvider.validateLogoutResponse(req.query.SAMLResponse, async (err, inResponseTo) => {
			if (err) {
				return;
			}

			if (!inResponseTo) {
				throw new Meteor.Error('Invalid logout request: no inResponseTo value.');
			}

			const logOutUser = async (inResponseTo: string): Promise<void> => {
				SAMLUtils.log(`Logging Out user via inResponseTo ${inResponseTo}`);

				const loggedOutUsers = await Users.findBySAMLInResponseTo(inResponseTo).toArray();
				if (loggedOutUsers.length > 1) {
					throw new Meteor.Error('Found multiple users matching SAML inResponseTo fields');
				}

				if (loggedOutUsers.length === 0) {
					throw new Meteor.Error('Invalid logout request: no user associated with inResponseTo.');
				}

				await this._logoutRemoveTokens(loggedOutUsers[0]._id);
			};

			try {
				await logOutUser(inResponseTo);
			} finally {
				res.writeHead(302, {
					Location: req.query.RelayState,
				});
				res.end();
			}
		});
	}

	private static processSLORedirectAction(req: IIncomingMessage, res: ServerResponse): void {
		res.writeHead(302, {
			// credentialToken here is the SAML LogOut Request that we'll send back to IDP
			Location: req.query.redirect,
		});
		res.end();
	}

	private static async processAuthorizeAction(
		res: ServerResponse,
		service: IServiceProviderOptions,
		samlObject: ISAMLAction,
	): Promise<void> {
		const serviceProvider = new SAMLServiceProvider(service);
		let url: string | undefined;

		try {
			url = await serviceProvider.getAuthorizeUrl(samlObject.credentialToken);
		} catch (err: any) {
			SAMLUtils.error('Unable to generate authorize url');
			SAMLUtils.error(err);
			url = Meteor.absoluteUrl();
		}

		res.writeHead(302, {
			Location: url,
		});
		res.end();
	}

	private static processValidateAction(
		req: IIncomingMessage,
		res: ServerResponse,
		service: IServiceProviderOptions,
		_samlObject: ISAMLAction,
	): void {
		const serviceProvider = new SAMLServiceProvider(service);
		SAMLUtils.relayState = req.body.RelayState;
		serviceProvider.validateResponse(req.body.SAMLResponse, async (err, profile /* , loggedOut*/) => {
			try {
				if (err) {
					SAMLUtils.error(err);
					throw new Error('Unable to validate response url');
				}

				if (!profile) {
					throw new Error('No user data collected from IdP response.');
				}

				// create a random token to store the login result
				// to test an IdP initiated login on localhost, use the following URL (assuming SimpleSAMLPHP on localhost:8080):
				// http://localhost:8080/simplesaml/saml2/idp/SSOService.php?spentityid=http://localhost:3000/_saml/metadata/test-sp
				const credentialToken = Random.id();

				const loginResult = {
					profile,
				};

				await this.storeCredential(credentialToken, loginResult);
				const url = Meteor.absoluteUrl(SAMLUtils.getValidationActionRedirectPath(credentialToken));
				res.writeHead(302, {
					Location: url,
				});
				res.end();
			} catch (error) {
				SAMLUtils.error(error);
				res.writeHead(302, {
					Location: Meteor.absoluteUrl(),
				});
				res.end();
			}
		});
	}

	private static async findUser(username: string | undefined, emailRegex: RegExp): Promise<IUser | undefined | null> {
		const { globalSettings } = SAMLUtils;

		if (globalSettings.immutableProperty === 'Username') {
			if (username) {
				return Users.findOne({
					username,
				});
			}

			return;
		}

		return Users.findOne({
			'emails.address': emailRegex,
		});
	}

	private static guessNameFromUsername(username: string): string {
		return username
			.replace(/\W/g, ' ')
			.replace(/\s(.)/g, (u) => u.toUpperCase())
			.replace(/^(.)/, (u) => u.toLowerCase())
			.replace(/^\w/, (u) => u.toUpperCase());
	}

	private static async subscribeToSAMLChannels(channels: Array<string>, user: IUser): Promise<void> {
		const { includePrivateChannelsInUpdate } = SAMLUtils.globalSettings;
		try {
			for await (let roomName of channels) {
				roomName = roomName.trim();
				if (!roomName) {
					continue;
				}

				const privRoom = await Rooms.findOneByNameAndType(roomName, 'p', {});

				if (privRoom && includePrivateChannelsInUpdate === true) {
					await addUserToRoom(privRoom._id, user);
					continue;
				}

				const room = await Rooms.findOneByNameAndType(roomName, 'c', {});
				if (room) {
					await addUserToRoom(room._id, user);
					continue;
				}

				if (!room && !privRoom) {
					// If the user doesn't have an username yet, we can't create new rooms for them
					if (user.username) {
						await createRoom('c', roomName, user);
					}
				}
			}
		} catch (err: any) {
			SystemLogger.error(err);
		}
	}
}
