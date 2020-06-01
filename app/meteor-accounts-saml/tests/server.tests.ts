/* eslint-env mocha */
import 'babel-polyfill';

import chai from 'chai';

import '../../lib/tests/server.mocks.js';
import { AuthorizeRequest } from '../server/lib/generators/AuthorizeRequest';
import { LogoutRequest } from '../server/lib/generators/LogoutRequest';
import { LogoutResponse } from '../server/lib/generators/LogoutResponse';
import { ServiceProviderMetadata } from '../server/lib/generators/ServiceProviderMetadata';
import { LogoutRequestParser } from '../server/lib/parsers/LogoutRequest';
import { LogoutResponseParser } from '../server/lib/parsers/LogoutResponse';
import { ResponseParser } from '../server/lib/parsers/Response';
import { SAMLUtils } from '../server/lib/Utils';
import {
	serviceProviderOptions,
	simpleMetadata,
	metadataWithCertificate,
	simpleLogoutRequest,
	invalidXml,
	randomXml,
	invalidLogoutRequest,
	simpleLogoutResponse,
	invalidLogoutResponse,
	simpleSamlResponse,
	profile,
} from './data';
import '../../../definition/xml-encryption';

const { expect } = chai;

describe('SAML', () => {
	describe('[AuthorizeRequest]', () => {
		describe('AuthorizeRequest.generate', () => {
			it('should use the custom templates to generate the request', () => {
				const authorizeRequest = AuthorizeRequest.generate(serviceProviderOptions);
				expect(authorizeRequest.request).to.be.equal('<authRequest><NameID IdentifierFormat="email"/> <authnContext Comparison="Whatever">Password</authnContext> </authRequest>');
			});

			it('should include the unique ID on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					authRequestTemplate: '__uniqueId__',
				};

				const authorizeRequest = AuthorizeRequest.generate(customOptions);
				expect(authorizeRequest.request).to.be.equal(authorizeRequest.id);
			});

			it('should include the custom options on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					authRequestTemplate: '__callbackUrl__ __entryPoint__ __issuer__',
				};

				const authorizeRequest = AuthorizeRequest.generate(customOptions);
				expect(authorizeRequest.request).to.be.equal('[callback-url] [entry-point] [issuer]');
			});
		});
	});

	describe('[LogoutRequest]', () => {
		describe('LogoutRequest.generate', () => {
			it('should use the custom template to generate the request', () => {
				const logoutRequest = LogoutRequest.generate(serviceProviderOptions, 'NameID', 'sessionIndex');
				expect(logoutRequest.request).to.be.equal('[logout-request-template]');
			});

			it('should include the unique ID on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutRequestTemplate: '__uniqueId__',
				};

				const logoutRequest = LogoutRequest.generate(customOptions, 'NameID', 'sessionIndex');
				expect(logoutRequest.request).to.be.equal(logoutRequest.id);
			});

			it('should include the custom options on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutRequestTemplate: '__idpSLORedirectURL__ __issuer__ __identifierFormat__ __nameID__ __sessionIndex__',
				};

				const logoutRequest = LogoutRequest.generate(customOptions, 'NameID', 'sessionIndex');
				expect(logoutRequest.request).to.be.equal('[idpSLORedirectURL] [issuer] email NameID sessionIndex');
			});
		});

		describe('LogoutRequest.validate', () => {
			it('should extract the idpSession and nameID from the request', () => {
				const parser = new LogoutRequestParser(serviceProviderOptions);

				parser.validate(simpleLogoutRequest, (err, data) => {
					expect(err).to.be.null;
					expect(data).to.be.an('object');
					expect(data).to.have.property('idpSession');
					expect(data).to.have.property('nameID');
					// @ts-ignore -- chai already ensured the object exists
					expect(data.idpSession).to.be.equal('_d6ad0e25459aaddd0433a81e159aa79e55dc52c280');
					// @ts-ignore -- chai already ensured the object exists
					expect(data.nameID).to.be.equal('_ab7e1d9a603473e92148d569d50176bafa60bcb2e9');
				});
			});

			it('should fail to parse an invalid xml', () => {
				const parser = new LogoutRequestParser(serviceProviderOptions);
				parser.validate(invalidXml, (err, data) => {
					expect(err).to.be.exist;
					expect(data).to.not.exist;
				});
			});

			it('should fail to parse a xml without any LogoutRequest tag', () => {
				const parser = new LogoutRequestParser(serviceProviderOptions);
				parser.validate(randomXml, (err, data) => {
					expect(err).to.be.equal('No Request Found');
					expect(data).to.not.exist;
				});
			});

			it('should fail to parse a request with no NameId', () => {
				const parser = new LogoutRequestParser(serviceProviderOptions);

				parser.validate(invalidLogoutRequest, (err, data) => {
					expect(err).to.be.an('error').that.has.property('message').equal('SAML Logout Request: No NameID node found');
					expect(data).to.not.exist;
				});
			});
		});
	});

	describe('[LogoutResponse]', () => {
		describe('LogoutResponse.generate', () => {
			it('should use the custom template to generate the response', () => {
				const logoutResponse = LogoutResponse.generate(serviceProviderOptions, 'NameID', 'sessionIndex');
				expect(logoutResponse.response).to.be.equal('[logout-response-template]');
			});

			it('should include the unique ID on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__uniqueId__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions, 'NameID', 'sessionIndex');
				expect(logoutResponse.response).to.be.equal(logoutResponse.id);
			});

			it('should include the custom options on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__idpSLORedirectURL__ __issuer__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions, 'NameID', 'sessionIndex');
				expect(logoutResponse.response).to.be.equal('[idpSLORedirectURL] [issuer]');
			});
		});

		describe('LogoutResponse.validate', () => {
			it('should extract the inResponseTo from the response', () => {
				const logoutResponse = simpleLogoutResponse
					.replace('[STATUSCODE]', 'urn:oasis:names:tc:SAML:2.0:status:Success');
				const parser = new LogoutResponseParser(serviceProviderOptions);

				parser.validate(logoutResponse, (err, inResponseTo) => {
					expect(err).to.be.null;
					expect(inResponseTo).to.be.equal('_id-6530db3fcd23dc42a31c');
				});
			});

			it('should reject a response with a non-success StatusCode', () => {
				const logoutResponse = simpleLogoutResponse
					.replace('[STATUSCODE]', 'Anything');
				const parser = new LogoutResponseParser(serviceProviderOptions);

				parser.validate(logoutResponse, (err, inResponseTo) => {
					expect(err).to.be.equal('Error. Logout not confirmed by IDP');
					expect(inResponseTo).to.be.null;
				});
			});

			it('should fail to parse an invalid xml', () => {
				const parser = new LogoutResponseParser(serviceProviderOptions);
				parser.validate(invalidXml, (err, inResponseTo) => {
					expect(err).to.be.exist;
					expect(inResponseTo).to.not.exist;
				});
			});

			it('should fail to parse a xml without any LogoutResponse tag', () => {
				const parser = new LogoutResponseParser(serviceProviderOptions);
				parser.validate(randomXml, (err, inResponseTo) => {
					expect(err).to.be.equal('No Response Found');
					expect(inResponseTo).to.not.exist;
				});
			});

			it('should fail to parse a xml without an inResponseTo attribute', () => {
				const instant = new Date().toISOString();
				const logoutResponse = simpleLogoutResponse
					.replace('[INSTANT]', instant)
					.replace('[STATUSCODE]', 'urn:oasis:names:tc:SAML:2.0:status:Success')
					.replace('InResponseTo=', 'SomethingElse=');

				const parser = new LogoutResponseParser(serviceProviderOptions);
				parser.validate(logoutResponse, (err, inResponseTo) => {
					expect(err).to.be.equal('Unexpected Response from IDP');
					expect(inResponseTo).to.not.exist;
				});
			});

			it('should reject a response with no status tag', () => {
				const parser = new LogoutResponseParser(serviceProviderOptions);

				parser.validate(invalidLogoutResponse, (err, inResponseTo) => {
					expect(err).to.be.equal('Error. Logout not confirmed by IDP');
					expect(inResponseTo).to.be.null;
				});
			});
		});
	});

	describe('[Metadata]', () => {
		describe('[Metadata.generate]', () => {
			it('should generate a simple metadata file when no certificate info is included', () => {
				const metadata = ServiceProviderMetadata.generate(serviceProviderOptions);
				expect(metadata).to.be.equal(simpleMetadata);
			});

			it('should include additional information when a certificate is provided', () => {
				const customOptions = {
					...serviceProviderOptions,
					privateCert: '[CERTIFICATE_CONTENT]',
					privateKey: '[PRIVATE_KEY]',
				};

				const metadata = ServiceProviderMetadata.generate(customOptions);
				expect(metadata).to.be.equal(metadataWithCertificate);
			});
		});
	});

	describe('[Response]', () => {
		describe('[Response.validate]', () => {
			it('should extract a profile from the response', () => {
				const notBefore = new Date();
				notBefore.setMinutes(notBefore.getMinutes() - 3);

				const notOnOrAfter = new Date();
				notOnOrAfter.setMinutes(notOnOrAfter.getMinutes() + 3);

				const response = simpleSamlResponse
					.replace('[NOTBEFORE]', notBefore.toISOString())
					.replace('[NOTONORAFTER]', notOnOrAfter.toISOString());

				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(response, (err, profile, loggedOut) => {
					expect(err).to.be.null;
					expect(profile).to.be.an('object');
					expect(profile).to.have.property('inResponseToId').equal('[INRESPONSETO]');
					expect(profile).to.have.property('issuer').equal('[ISSUER]');
					expect(profile).to.have.property('nameID').equal('[NAMEID]');
					expect(profile).to.have.property('sessionIndex').equal('[SESSIONINDEX]');
					expect(profile).to.have.property('uid').equal('1');
					expect(profile).to.have.property('eduPersonAffiliation').equal('group1');
					expect(profile).to.have.property('email').equal('user1@example.com');
					expect(loggedOut).to.be.false;
				});
			});
		});
	});

	describe('[Login]', () => {
		describe('UserMapping', () => {
			it('should collect all appropriate data from the profile, respecting the fieldMap', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: 'anotherUsername',
					email: 'singleEmail',
					name: 'anotherName',
					customField1: 'customField1',
					customField2: 'customField2',
					customField3: 'customField3',
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);
				globalSettings.roleAttributeName = 'roles';

				SAMLUtils.updateGlobalSettings(globalSettings);
				SAMLUtils.relayState = '[RelayState]';
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('samlLogin').that.is.an('object');
				expect(userObject).to.have.nested.property('samlLogin.provider').that.is.equal('[RelayState]');
				expect(userObject).to.have.nested.property('samlLogin.idp').that.is.equal('[IssuerName]');
				expect(userObject).to.have.nested.property('samlLogin.idpSession').that.is.equal('[SessionIndex]');
				expect(userObject).to.have.nested.property('samlLogin.nameID').that.is.equal('[nameID]');
				expect(userObject).to.have.property('emailList').that.is.an('array').that.includes('testing@server.com');
				expect(userObject).to.have.property('fullName').that.is.equal('[AnotherName]');
				expect(userObject).to.have.property('username').that.is.equal('[AnotherUserName]');
				expect(userObject).to.have.property('roles').that.is.an('array').with.members(['user', 'ruler', 'admin', 'king', 'president', 'governor', 'mayor']);
				expect(userObject).to.have.property('channels').that.is.an('array').with.members(['pets', 'pics', 'funny', 'random', 'babies']);

				const map = new Map();
				map.set('customField1', 'value1');
				map.set('customField2', 'value2');
				map.set('customField3', 'value3');

				expect(userObject).to.have.property('customFields').that.is.a('Map').and.is.deep.equal(map);
			});

			it('should reject an userDataFieldMap without an email field', () => {
				const { globalSettings } = SAMLUtils;
				globalSettings.userDataFieldMap = JSON.stringify({});
				SAMLUtils.updateGlobalSettings(globalSettings);

				expect(() => {
					SAMLUtils.mapProfileToUserObject(profile);
				}).to.throw('SAML Profile did not contain an email address');
			});

			it('should fail to map a profile that is missing the email field', () => {
				const { globalSettings } = SAMLUtils;
				const fieldMap = {
					inexistentField: 'email',
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);
				SAMLUtils.updateGlobalSettings(globalSettings);

				expect(() => {
					SAMLUtils.mapProfileToUserObject(profile);
				}).to.throw('SAML Profile did not contain an email address');
			});

			it('should load data from the default fields when the field map is lacking', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					email: 'singleEmail',
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('fullName').that.is.equal('[DisplayName]');
				expect(userObject).to.have.property('username').that.is.equal('[username]');
			});

			it('should assign the default role when the roleAttributeName is missing', () => {
				const { globalSettings } = SAMLUtils;
				globalSettings.roleAttributeName = '';
				SAMLUtils.updateGlobalSettings(globalSettings);

				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object').that.have.property('roles').that.is.an('array').with.members(['user']);
			});

			it('should assign the default role when the value of the role attribute is missing', () => {
				const { globalSettings } = SAMLUtils;
				globalSettings.roleAttributeName = 'inexistentField';
				SAMLUtils.updateGlobalSettings(globalSettings);

				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object').that.have.property('roles').that.is.an('array').with.members(['user']);
			});

			it('should run custom regexes when one is used', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: {
						fieldName: 'singleEmail',
						regex: '(.*)@.+$',
					},
					email: 'singleEmail',
					name: 'anotherName',
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				SAMLUtils.relayState = '[RelayState]';
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('username').that.is.equal('testing');
			});

			it('should run custom templates when one is used', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: {
						fieldName: 'anotherName',
						template: 'user-__anotherName__',
					},
					email: 'singleEmail',
					name: {
						fieldNames: [
							'anotherName',
							'displayName',
						],
						template: '__displayName__ (__anotherName__)',
					},
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				SAMLUtils.relayState = '[RelayState]';
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('username').that.is.equal('user-[AnotherName]');
				expect(userObject).to.have.property('fullName').that.is.equal('[DisplayName] ([AnotherName])');
			});

			it('should combine regexes and templates when both are used', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: {
						fieldName: 'anotherName',
						template: 'user-__anotherName__45@7',
						regex: 'user-(.*)@',
					},
					email: 'singleEmail',
					name: {
						fieldNames: [
							'anotherName',
							'displayName',
						],
						regex: '\\[(.*)\\]',
						template: '__displayName__ (__regex__)',
					},
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				SAMLUtils.relayState = '[RelayState]';
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				// should run the template first, then the regex
				expect(userObject).to.have.property('username').that.is.equal('[AnotherName]45');
				// for this one, should run the regex first, then the template
				expect(userObject).to.have.property('fullName').that.is.equal('[DisplayName] (AnotherName)');
			});

			it('should collect the values of every attribute on the field map', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: 'anotherUsername',
					email: 'singleEmail',
					name: 'anotherName',
					others: {
						fieldNames: [
							'issuer',
							'sessionIndex',
							'nameID',
							'displayName',
							'username',
							'roles',
							'otherRoles',
							'language',
							'channels',
							'customField1',
						],
					},
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('attributeList').that.is.a('Map').that.have.keys([
					'anotherUsername',
					'singleEmail',
					'anotherName',
					'issuer',
					'sessionIndex',
					'nameID',
					'displayName',
					'username',
					'roles',
					'otherRoles',
					'language',
					'channels',
					'customField1',
				]);

				for (const [key, value] of userObject.attributeList) {
					// @ts-ignore
					expect(value).to.be.equal(profile[key]);
				}
			});

			it('should use the immutable property as default identifier', () => {
				const { globalSettings } = SAMLUtils;

				globalSettings.immutableProperty = 'EMail';
				SAMLUtils.updateGlobalSettings(globalSettings);

				const userObject = SAMLUtils.mapProfileToUserObject(profile);
				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('identifier').that.has.property('type').that.is.equal('email');

				globalSettings.immutableProperty = 'Username';
				SAMLUtils.updateGlobalSettings(globalSettings);

				const newUserObject = SAMLUtils.mapProfileToUserObject(profile);
				expect(newUserObject).to.be.an('object');
				expect(newUserObject).to.have.property('identifier').that.has.property('type').that.is.equal('username');
			});

			it('should collect the identifier from the fieldset', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: 'anotherUsername',
					email: 'singleEmail',
					name: 'anotherName',
					__identifier__: 'customField3',
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);
				SAMLUtils.updateGlobalSettings(globalSettings);

				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('identifier').that.has.property('type').that.is.equal('custom');
				expect(userObject).to.have.property('identifier').that.has.property('attribute').that.is.equal('customField3');
			});
		});
	});
});
