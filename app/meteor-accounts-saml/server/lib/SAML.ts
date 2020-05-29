import { ServerResponse } from 'http';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import fiber from 'fibers';
import s from 'underscore.string';

import { settings } from '../../../settings/server';
import { Users, Rooms, CredentialTokens } from '../../../models/server';
import { IUser } from '../../../../definition/IUser';
import { IIncomingMessage } from '../../../../definition/IIncomingMessage';
import { createRoom } from '../../../lib/server/functions';
import { SAMLServiceProvider } from './ServiceProvider';
import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
import { ISAMLAction } from '../definition/ISAMLAction';
import { SAMLUtils } from './Utils';

const showErrorMessage = function(res: ServerResponse, err: string): void {
	res.writeHead(200, {
		'Content-Type': 'text/html',
	});
	const content = `<html><body><h2>Sorry, an annoying error occured</h2><div>${ s.escapeHTML(err) }</div></body></html>`;
	res.end(content, 'utf-8');
};

export class SAML {
	static processRequest(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions, samlObject: ISAMLAction): void {
		// Skip everything if there's no service set by the saml middleware
		if (!service) {
			if (samlObject.actionName === 'metadata') {
				showErrorMessage(res, `Unexpected SAML service ${ samlObject.serviceName }`);
				return;
			}

			throw new Error(`Unexpected SAML service ${ samlObject.serviceName }`);
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
				throw new Error(`Unexpected SAML action ${ samlObject.actionName }`);
		}
	}

	static processMetadataAction(res: ServerResponse, service: IServiceProviderOptions): void {
		try {
			const serviceProvider = new SAMLServiceProvider(service);

			res.writeHead(200);
			res.write(serviceProvider.generateServiceProviderMetadata());
			res.end();
		} catch (err) {
			showErrorMessage(res, err);
		}
	}

	static processLogoutAction(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions): void {
		// This is where we receive SAML LogoutResponse
		if (req.query.SAMLRequest) {
			return this.processLogoutRequest(req, res, service);
		}

		return this.processLogoutResponse(req, res, service);
	}

	static _logoutRemoveTokens(userId: string): void {
		SAMLUtils.log(`Found user ${ userId }`);

		Meteor.users.update({
			_id: userId,
		}, {
			$set: {
				'services.resume.loginTokens': [],
			},
		});

		Meteor.users.update({
			_id: userId,
		}, {
			$unset: {
				'services.saml': '',
			},
		});
	}

	static processLogoutRequest(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions): void {
		const serviceProvider = new SAMLServiceProvider(service);
		serviceProvider.validateLogoutRequest(req.query.SAMLRequest, (err, result) => {
			if (err) {
				console.error(err);
				throw new Meteor.Error('Unable to Validate Logout Request');
			}

			if (!result) {
				throw new Meteor.Error('Unable to process Logout Request: missing request data.');
			}

			const logOutUser = (samlInfo: Record<string, string | null>): void => {
				const loggedOutUser = Meteor.users.find({
					$or: [
						{ 'services.saml.nameID': samlInfo.nameID },
						{ 'services.saml.idpSession': samlInfo.idpSession },
					],
				}).fetch();

				if (loggedOutUser.length === 1) {
					this._logoutRemoveTokens(loggedOutUser[0]._id);
				}
			};

			fiber(() => logOutUser(result)).run();

			const { response } = serviceProvider.generateLogoutResponse({
				nameID: result.nameID || '',
				sessionIndex: result.idpSession || '',
			});

			serviceProvider.logoutResponseToUrl(response, (err, url) => {
				if (err) {
					console.error(err);
					throw new Meteor.Error('Unable to generate SAML logout Response Url');
				}

				res.writeHead(302, {
					Location: url,
				});
				res.end();
			});
		});
	}

	static processLogoutResponse(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions): void {
		if (!req.query.SAMLResponse) {
			SAMLUtils.log('-----RECEIVED PARAMS (Missing SAMLResponse)-----');
			SAMLUtils.log(req.query);

			throw new Error('Invalid LogoutResponse received. Additional information is available on the log if Debug mode is enabled.');
		}

		const serviceProvider = new SAMLServiceProvider(service);
		serviceProvider.validateLogoutResponse(req.query.SAMLResponse, (err, inResponseTo) => {
			if (err) {
				return;
			}

			if (!inResponseTo) {
				throw new Meteor.Error('Invalid logout request: no inResponseTo value.');
			}

			const logOutUser = (inResponseTo: string): void => {
				SAMLUtils.log(`Logging Out user via inResponseTo ${ inResponseTo }`);

				const cursor = Users.find({
					'services.saml.inResponseTo': inResponseTo,
				});

				const count = cursor.count();
				if (count > 1) {
					throw new Meteor.Error('Found multiple users matching SAML inResponseTo fields');
				}

				if (count === 0) {
					throw new Meteor.Error('Invalid logout request: no user associaited with inResponseTo.');
				}

				const loggedOutUser = cursor.fetch();
				this._logoutRemoveTokens(loggedOutUser[0]._id);
			};

			fiber(() => logOutUser(inResponseTo)).run();

			res.writeHead(302, {
				Location: req.query.RelayState,
			});
			res.end();
		});
	}

	static processSLORedirectAction(req: IIncomingMessage, res: ServerResponse): void {
		res.writeHead(302, {
			// credentialToken here is the SAML LogOut Request that we'll send back to IDP
			Location: req.query.redirect,
		});
		res.end();
	}

	static processAuthorizeAction(res: ServerResponse, service: IServiceProviderOptions, samlObject: ISAMLAction): void {
		service.id = samlObject.credentialToken;

		const serviceProvider = new SAMLServiceProvider(service);
		serviceProvider.getAuthorizeUrl((err, url) => {
			if (err) {
				throw new Error('Unable to generate authorize url');
			}
			res.writeHead(302, {
				Location: url,
			});
			res.end();
		});
	}

	static processValidateAction(req: IIncomingMessage, res: ServerResponse, service: IServiceProviderOptions, samlObject: ISAMLAction): void {
		const serviceProvider = new SAMLServiceProvider(service);
		SAMLUtils.relayState = req.body.RelayState;
		serviceProvider.validateResponse(req.body.SAMLResponse, (err, profile/* , loggedOut*/) => {
			if (err) {
				throw new Error(`Unable to validate response url: ${ err }`);
			}

			if (!profile) {
				throw new Error('No user data collected from IdP response.');
			}

			let credentialToken = (profile.inResponseToId && profile.inResponseToId.value) || profile.inResponseToId || profile.InResponseTo || samlObject.credentialToken;
			const loginResult = {
				profile,
			};

			if (!credentialToken) {
				// No credentialToken in IdP-initiated SSO
				credentialToken = Random.id();
				SAMLUtils.log('[SAML] Using random credentialToken: ', credentialToken);
			}

			this.storeCredential(credentialToken, loginResult);
			const url = `${ Meteor.absoluteUrl('home') }?saml_idp_credentialToken=${ credentialToken }`;
			res.writeHead(302, {
				Location: url,
			});
			res.end();
		});
	}

	static findUser(username: string, emailRegex: RegExp): IUser | undefined {
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

	static guessNameFromUsername(username: string): string {
		return username
			.replace(/\W/g, ' ')
			.replace(/\s(.)/g, (u) => u.toUpperCase())
			.replace(/^(.)/, (u) => u.toLowerCase())
			.replace(/^\w/, (u) => u.toUpperCase());
	}

	static overwriteData(user: IUser, fullName: string, eppnMatch: boolean, emailList: Array<string>): void {
		const { globalSettings } = SAMLUtils;

		// Overwrite fullname if needed
		if (globalSettings.nameOverwrite === true) {
			Users.update({
				_id: user._id,
			}, {
				$set: {
					name: fullName,
				},
			});
		}

		// Overwrite mail if needed
		if (globalSettings.mailOverwrite === true && eppnMatch === true) {
			Users.update({
				_id: user._id,
			}, {
				$set: {
					emails: emailList.map((email) => ({
						address: email,
						verified: settings.get('Accounts_Verify_Email_For_External_Accounts'),
					})),
				},
			});
		}
	}

	static normalizeUsername(name: string): string {
		const { globalSettings } = SAMLUtils;

		switch (globalSettings.usernameNormalize) {
			case 'Lowercase':
				name = name.toLowerCase();
				break;
		}

		return name;
	}

	static subscribeToSAMLChannels(channels: Array<string>, user: IUser): void {
		try {
			for (let roomName of channels) {
				roomName = roomName.trim();
				if (!roomName) {
					continue;
				}

				const room = Rooms.findOneByNameAndType(roomName, 'c', {});
				if (!room) {
					createRoom('c', roomName, user.username);
				}
			}
		} catch (err) {
			console.error(err);
		}
	}

	static hasCredential(credentialToken: string): boolean {
		return CredentialTokens.findOneById(credentialToken) != null;
	}

	static retrieveCredential(credentialToken: string): Record<string, any> | undefined {
		// The credentialToken in all these functions corresponds to SAMLs inResponseTo field and is mandatory to check.
		const data = CredentialTokens.findOneById(credentialToken);
		if (data) {
			return data.userInfo;
		}
	}

	static storeCredential(credentialToken: string, loginResult: object): void {
		CredentialTokens.create(credentialToken, loginResult);
	}
}
