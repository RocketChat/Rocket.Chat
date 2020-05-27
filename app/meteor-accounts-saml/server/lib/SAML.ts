import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import fiber from 'fibers';
import s from 'underscore.string';

import { SAMLServiceProvider } from './ServiceProvider';
import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';

const showErrorMessage = function(res: object, err: string): void {
	res.writeHead(200, {
		'Content-Type': 'text/html',
	});
	const content = `<html><body><h2>Sorry, an annoying error occured</h2><div>${ s.escapeHTML(err) }</div></body></html>`;
	res.end(content, 'utf-8');
};

export class SAML {
	static processRequest(req: object, res: object, service: IServiceProviderOptions, samlObject: object): void {
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
				return this.processMetadataAction(req, res, service);
			case 'logout':
				return this.processLogoutAction(req, res, service);
			case 'sloRedirect':
				return this.processSLORedirectAction(req, res);
			case 'authorize':
				return this.processAuthorizeAction(req, res, service, samlObject);
			case 'validate':
				return this.processValidateAction(req, res, service, samlObject);
			default:
				throw new Error(`Unexpected SAML action ${ samlObject.actionName }`);
		}
	}

	static processMetadataAction(req: object, res: object, service: IServiceProviderOptions): void {
		try {
			const serviceProvider = new SAMLServiceProvider(service);
			service.callbackUrl = Meteor.absoluteUrl(`_saml/validate/${ service.provider }`);

			res.writeHead(200);
			res.write(serviceProvider.generateServiceProviderMetadata(service.callbackUrl));
			res.end();
		} catch (err) {
			showErrorMessage(res, err);
		}
	}

	static processLogoutAction(req: object, res: object, service: IServiceProviderOptions): void {
		// This is where we receive SAML LogoutResponse
		if (req.query.SAMLRequest) {
			return this.processLogoutRequest(req, res, service);
		}

		return this.processLogoutResponse(req, res, service);
	}

	static _logoutRemoveTokens(userId: string): void {
		if (Accounts.saml.settings.debug) {
			console.log(`Found user ${ userId }`);
		}

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

	static processLogoutRequest(req: object, res: object, service: IServiceProviderOptions): void {
		const serviceProvider = new SAMLServiceProvider(service);
		serviceProvider.validateLogoutRequest(req.query.SAMLRequest, (err, result) => {
			if (err) {
				console.error(err);
				throw new Meteor.Error('Unable to Validate Logout Request');
			}

			const logOutUser = (samlInfo: object): void => {
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
				nameID: result.nameID,
				sessionIndex: result.idpSession,
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

	static processLogoutResponse(req: object, res: object, service: IServiceProviderOptions): void {
		const serviceProvider = new SAMLServiceProvider(service);
		serviceProvider.validateLogoutResponse(req.query.SAMLResponse, (err, result) => {
			if (!err) {
				const logOutUser = (inResponseTo: string): void => {
					if (Accounts.saml.settings.debug) {
						console.log(`Logging Out user via inResponseTo ${ inResponseTo }`);
					}
					const loggedOutUser = Meteor.users.find({
						'services.saml.inResponseTo': inResponseTo,
					}).fetch();
					if (loggedOutUser.length === 1) {
						this._logoutRemoveTokens(loggedOutUser[0]._id);
					} else {
						throw new Meteor.Error('Found multiple users matching SAML inResponseTo fields');
					}
				};

				fiber(() => logOutUser(result)).run();

				res.writeHead(302, {
					Location: req.query.RelayState,
				});
				res.end();
			}
		});
	}

	static processSLORedirectAction(req: object, res: object): void {
		res.writeHead(302, {
			// credentialToken here is the SAML LogOut Request that we'll send back to IDP
			Location: req.query.redirect,
		});
		res.end();
	}

	static processAuthorizeAction(req: object, res: object, service: IServiceProviderOptions, samlObject: object): void {
		service.callbackUrl = Meteor.absoluteUrl(`_saml/validate/${ service.provider }`);
		service.id = samlObject.credentialToken;

		const serviceProvider = new SAMLServiceProvider(service);
		serviceProvider.getAuthorizeUrl(req, (err, url) => {
			if (err) {
				throw new Error('Unable to generate authorize url');
			}
			res.writeHead(302, {
				Location: url,
			});
			res.end();
		});
	}

	static processValidateAction(req: object, res: object, service: IServiceProviderOptions, samlObject: object): void {
		const serviceProvider = new SAMLServiceProvider(service);
		Accounts.saml.RelayState = req.body.RelayState;
		serviceProvider.validateResponse(req.body.SAMLResponse, req.body.RelayState, (err, profile/* , loggedOut*/) => {
			if (err) {
				throw new Error(`Unable to validate response url: ${ err }`);
			}

			let credentialToken = (profile.inResponseToId && profile.inResponseToId.value) || profile.inResponseToId || profile.InResponseTo || samlObject.credentialToken;
			const loginResult = {
				profile,
			};

			if (!credentialToken) {
				// No credentialToken in IdP-initiated SSO
				credentialToken = Random.id();

				if (Accounts.saml.settings.debug) {
					console.log('[SAML] Using random credentialToken: ', credentialToken);
				}
			}

			Accounts.saml.storeCredential(credentialToken, loginResult);
			const url = `${ Meteor.absoluteUrl('home') }?saml_idp_credentialToken=${ credentialToken }`;
			res.writeHead(302, {
				Location: url,
			});
			res.end();
		});
	}
}
