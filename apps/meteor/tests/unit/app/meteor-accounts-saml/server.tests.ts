import { expect } from 'chai';

import '../lib/server.mocks';
import { AuthorizeRequest } from '../../../../app/meteor-accounts-saml/server/lib/generators/AuthorizeRequest';
import { LogoutRequest } from '../../../../app/meteor-accounts-saml/server/lib/generators/LogoutRequest';
import { LogoutResponse } from '../../../../app/meteor-accounts-saml/server/lib/generators/LogoutResponse';
import { ServiceProviderMetadata } from '../../../../app/meteor-accounts-saml/server/lib/generators/ServiceProviderMetadata';
import { LogoutRequestParser } from '../../../../app/meteor-accounts-saml/server/lib/parsers/LogoutRequest';
import { LogoutResponseParser } from '../../../../app/meteor-accounts-saml/server/lib/parsers/LogoutResponse';
import { ResponseParser } from '../../../../app/meteor-accounts-saml/server/lib/parsers/Response';
import { SAMLUtils } from '../../../../app/meteor-accounts-saml/server/lib/Utils';
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
	samlResponse,
	duplicatedSamlResponse,
	samlResponseMissingStatus,
	samlResponseFailedStatus,
	samlResponseMultipleAssertions,
	samlResponseMissingAssertion,
	samlResponseMultipleIssuers,
	samlResponseValidSignatures,
	samlResponseValidAssertionSignature,
	encryptedResponse,
	profile,
	certificate,
	privateKeyCert,
	privateKey,
} from './data';

describe('SAML', () => {
	describe('[AuthorizeRequest]', () => {
		describe('AuthorizeRequest.generate', () => {
			it('should use the custom templates to generate the request', () => {
				const authorizeRequest = AuthorizeRequest.generate(serviceProviderOptions);
				expect(authorizeRequest.request).to.be.equal(
					'<authRequest><NameID IdentifierFormat="email"/> <authnContext Comparison="Whatever">Password</authnContext> </authRequest>',
				);
			});

			it('should include the unique ID on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					authRequestTemplate: '__newId__',
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
					logoutRequestTemplate: '__newId__',
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
					expect(err).to.exist;
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
				const logoutResponse = LogoutResponse.generate(serviceProviderOptions, 'NameID', 'sessionIndex', 'inResponseToId');
				expect(logoutResponse.response).to.be.equal('[logout-response-template]');
			});

			it('should include the unique ID on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__newId__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions, 'NameID', 'sessionIndex', 'inResponseToId');
				expect(logoutResponse.response).to.be.equal(logoutResponse.id);
			});

			it('should include the custom options on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__idpSLORedirectURL__ __issuer__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions, 'NameID', 'sessionIndex', 'inResponseToId');
				expect(logoutResponse.response).to.be.equal('[idpSLORedirectURL] [issuer]');
			});
		});

		describe('LogoutResponse.validate', () => {
			it('should extract the inResponseTo from the response', () => {
				const logoutResponse = simpleLogoutResponse.replace('[STATUSCODE]', 'urn:oasis:names:tc:SAML:2.0:status:Success');
				const parser = new LogoutResponseParser(serviceProviderOptions);

				parser.validate(logoutResponse, (err, inResponseTo) => {
					expect(err).to.be.null;
					expect(inResponseTo).to.be.equal('_id-6530db3fcd23dc42a31c');
				});
			});

			it('should reject a response with a non-success StatusCode', () => {
				const logoutResponse = simpleLogoutResponse.replace('[STATUSCODE]', 'Anything');
				const parser = new LogoutResponseParser(serviceProviderOptions);

				parser.validate(logoutResponse, (err, inResponseTo) => {
					expect(err).to.be.equal('Error. Logout not confirmed by IDP');
					expect(inResponseTo).to.be.null;
				});
			});

			it('should fail to parse an invalid xml', () => {
				const parser = new LogoutResponseParser(serviceProviderOptions);
				parser.validate(invalidXml, (err, inResponseTo) => {
					expect(err).to.exist;
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
					expect(profile).to.have.property('channels').that.is.an('array').that.is.deep.equal(['channel1', 'pets', 'random']);
					expect(loggedOut).to.be.false;
				});
			});

			it('should respect NotOnOrAfter conditions', () => {
				const notBefore = new Date();
				notBefore.setMinutes(notBefore.getMinutes() - 3);

				const response = samlResponse.replace('[NOTBEFORE]', notBefore.toISOString()).replace('[NOTONORAFTER]', new Date().toISOString());

				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(response, (err, profile, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(profile).to.be.null;
					expect(loggedOut).to.be.false;
				});
			});

			it('should respect NotBefore conditions', () => {
				const notBefore = new Date();
				notBefore.setMinutes(notBefore.getMinutes() + 3);

				const notOnOrAfter = new Date();
				notOnOrAfter.setMinutes(notOnOrAfter.getMinutes() + 3);

				const response = samlResponse.replace('[NOTBEFORE]', notBefore.toISOString()).replace('[NOTONORAFTER]', notOnOrAfter.toISOString());

				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(response, (err, profile, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(profile).to.be.null;
					expect(loggedOut).to.be.false;
				});
			});

			it('should fail to parse an invalid xml', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(invalidXml, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Unknown SAML response message');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should fail to parse a xml without any Response tag', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(randomXml, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Unknown SAML response message');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should reject a xml with multiple responses', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(duplicatedSamlResponse, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Too many SAML responses');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should fail to parse a reponse with no Status tag', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(samlResponseMissingStatus, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Missing StatusCode');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should fail to parse a reponse with a failed status', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(samlResponseFailedStatus, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Status is: Failed');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should reject a response with multiple assertions', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(samlResponseMultipleAssertions, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Too many SAML assertions');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should reject a response with no assertions', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(samlResponseMissingAssertion, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Missing SAML assertion');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should reject a document without signatures if the setting requires at least one', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Either',
					cert: 'invalidCert',
				};

				const notBefore = new Date();
				notBefore.setMinutes(notBefore.getMinutes() - 3);

				const notOnOrAfter = new Date();
				notOnOrAfter.setMinutes(notOnOrAfter.getMinutes() + 3);

				const response = simpleSamlResponse
					.replace('[NOTBEFORE]', notBefore.toISOString())
					.replace('[NOTONORAFTER]', notOnOrAfter.toISOString());

				const parser = new ResponseParser(providerOptions);
				parser.validate(response, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('No valid SAML Signature found');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should reject a document with multiple issuers', () => {
				const parser = new ResponseParser(serviceProviderOptions);
				parser.validate(samlResponseMultipleIssuers, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Too many Issuers');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should decrypt an encrypted response', () => {
				const options = {
					...serviceProviderOptions,
					privateCert: privateKeyCert,
					privateKey,
				};

				const parser = new ResponseParser(options);
				parser.validate(encryptedResponse, (err, profile, loggedOut) => {
					// No way to change the assertion conditions on an encrypted response ¯\_(ツ)_/¯
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
				});
			});

			it('should validate signatures on an encrypted response', () => {
				const options = {
					...serviceProviderOptions,
					privateCert: privateKeyCert,
					signatureValidationType: 'All',
					privateKey,
				};

				const parser = new ResponseParser(options);
				parser.validate(encryptedResponse, (err, profile, loggedOut) => {
					// No way to change the assertion conditions on an encrypted response ¯\_(ツ)_/¯
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
				});
			});
		});

		describe('[Validate Signatures]', () => {
			it('should reject an unsigned assertion if the setting says so', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Assertion',
					cert: 'invalidCert',
				};

				const notBefore = new Date();
				notBefore.setMinutes(notBefore.getMinutes() - 3);

				const notOnOrAfter = new Date();
				notOnOrAfter.setMinutes(notOnOrAfter.getMinutes() + 3);

				const response = simpleSamlResponse
					.replace('[NOTBEFORE]', notBefore.toISOString())
					.replace('[NOTONORAFTER]', notOnOrAfter.toISOString());

				const parser = new ResponseParser(providerOptions);
				parser.validate(response, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Invalid Assertion signature');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should reject an unsigned response if the setting says so', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Response',
					cert: 'invalidCert',
				};

				const notBefore = new Date();
				notBefore.setMinutes(notBefore.getMinutes() - 3);

				const notOnOrAfter = new Date();
				notOnOrAfter.setMinutes(notOnOrAfter.getMinutes() + 3);

				const response = simpleSamlResponse
					.replace('[NOTBEFORE]', notBefore.toISOString())
					.replace('[NOTONORAFTER]', notOnOrAfter.toISOString());

				const parser = new ResponseParser(providerOptions);
				parser.validate(response, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Invalid Signature');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should reject an assertion signed with an invalid signature', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Assertion',
					cert: certificate,
				};

				const notBefore = new Date();
				notBefore.setMinutes(notBefore.getMinutes() - 3);

				const notOnOrAfter = new Date();
				notOnOrAfter.setMinutes(notOnOrAfter.getMinutes() + 3);

				const response = samlResponse.replace('[NOTBEFORE]', notBefore.toISOString()).replace('[NOTONORAFTER]', notOnOrAfter.toISOString());

				const parser = new ResponseParser(providerOptions);
				parser.validate(response, (err, data, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Invalid Assertion signature');
					expect(data).to.not.exist;
					expect(loggedOut).to.be.false;
				});
			});

			it('should accept an assertion with a valid signature', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Assertion',
					cert: certificate,
				};

				const parser = new ResponseParser(providerOptions);
				parser.validate(samlResponseValidAssertionSignature, (err, profile, loggedOut) => {
					// To have a valid signature, we can't change the assertion conditions ¯\_(ツ)_/¯
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
				});
			});

			it('should accept a document with a valid response signature', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Response',
					cert: certificate,
				};

				const parser = new ResponseParser(providerOptions);
				parser.validate(samlResponseValidSignatures, (err, profile, loggedOut) => {
					// To have a valid signature, we can't change the assertion conditions ¯\_(ツ)_/¯
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
				});
			});

			it('should reject a document with a valid signature of the wrong type', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Response',
					cert: certificate,
				};

				const parser = new ResponseParser(providerOptions);
				parser.validate(samlResponseValidAssertionSignature, (err, profile, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Invalid Signature');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
				});
			});

			it('should accept a document with both valid signatures', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'All',
					cert: certificate,
				};

				const parser = new ResponseParser(providerOptions);
				parser.validate(samlResponseValidSignatures, (err, profile, loggedOut) => {
					// To have a valid signature, we can't change the assertion conditions ¯\_(ツ)_/¯
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
				});
			});

			it('should reject a document with a single signature when both are expected', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'All',
					cert: certificate,
				};

				const parser = new ResponseParser(providerOptions);
				parser.validate(samlResponseValidAssertionSignature, (err, profile, loggedOut) => {
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('Invalid Signature');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
				});
			});

			it('should accept a document with either valid signature', () => {
				const providerOptions = {
					...serviceProviderOptions,
					signatureValidationType: 'Either',
					cert: certificate,
				};

				const parser = new ResponseParser(providerOptions);
				parser.validate(samlResponseValidAssertionSignature, (err, profile, loggedOut) => {
					// To have a valid signature, we can't change the assertion conditions ¯\_(ツ)_/¯
					expect(err).to.be.an('error').that.has.property('message').that.is.equal('NotBefore / NotOnOrAfter assertion failed');
					expect(loggedOut).to.be.false;
					expect(profile).to.be.null;
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
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

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
				expect(userObject).to.not.have.property('roles');
				expect(userObject).to.have.property('channels').that.is.an('array').with.members(['pets', 'pics', 'funny', 'random', 'babies']);
			});

			it('should join array values if username receives an array of values', () => {
				const { globalSettings } = SAMLUtils;

				const multipleUsernames = {
					...profile,
					anotherUsername: ['user1', 'user2'],
				};

				SAMLUtils.updateGlobalSettings(globalSettings);
				const userObject = SAMLUtils.mapProfileToUserObject(multipleUsernames);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('samlLogin').that.is.an('object');
				expect(userObject).to.have.property('username').that.is.equal('user1 user2');
			});

			// Channels support both a comma separated single value and an array of values
			it('should support `channels` attribute with multiple values', () => {
				const channelsProfile = {
					...profile,
					channels: ['pets', 'pics', 'funny'],
				};

				const userObject = SAMLUtils.mapProfileToUserObject(channelsProfile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('channels').that.is.an('array').with.members(['pets', 'pics', 'funny']);
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
						fieldNames: ['anotherName', 'displayName'],
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
						fieldNames: ['anotherName', 'displayName'],
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

			it('should support individual array values on templates', () => {
				const { globalSettings } = SAMLUtils;

				const multipleUsernames = {
					...profile,
					anotherUsername: ['1', '2'],
				};

				const fieldMap = {
					username: {
						fieldName: 'anotherUsername',
						template: 'user-__anotherUsername[-1]__',
					},
					email: {
						fieldName: 'anotherUsername',
						template: 'user-__anotherUsername[0]__',
					},
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				const userObject = SAMLUtils.mapProfileToUserObject(multipleUsernames);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('username').that.is.equal('user-2');
				expect(userObject).to.have.property('emailList').that.is.an('array').that.includes('user-1');
			});

			it('should collect the values of every attribute on the field map', () => {
				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: 'anotherUsername',
					email: 'singleEmail',
					name: 'anotherName',
					others: {
						fieldNames: ['issuer', 'sessionIndex', 'nameID', 'displayName', 'username', 'roles', 'otherRoles', 'language', 'channels'],
					},
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject)
					.to.have.property('attributeList')
					.that.is.a('Map')
					.that.have.keys([
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
					]);

				// Workaround because chai doesn't handle Maps very well
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

	describe('Response Mapping', () => {
		it('should extract a mapped user from the response', () => {
			const notBefore = new Date();
			notBefore.setMinutes(notBefore.getMinutes() - 3);

			const notOnOrAfter = new Date();
			notOnOrAfter.setMinutes(notOnOrAfter.getMinutes() + 3);

			const response = simpleSamlResponse
				.replace('[NOTBEFORE]', notBefore.toISOString())
				.replace('[NOTONORAFTER]', notOnOrAfter.toISOString());

			const parser = new ResponseParser(serviceProviderOptions);
			parser.validate(response, (err, profile, loggedOut) => {
				expect(profile).to.be.an('object');
				expect(err).to.be.null;
				expect(loggedOut).to.be.false;

				const { globalSettings } = SAMLUtils;

				const fieldMap = {
					username: {
						fieldName: 'uid',
						template: 'user-__uid__',
					},
					email: 'email',
				};

				globalSettings.userDataFieldMap = JSON.stringify(fieldMap);

				SAMLUtils.updateGlobalSettings(globalSettings);
				SAMLUtils.relayState = '[RelayState]';

				// @ts-ignore
				const userObject = SAMLUtils.mapProfileToUserObject(profile);

				expect(userObject).to.be.an('object');
				expect(userObject).to.have.property('samlLogin').that.is.an('object');
				expect(userObject).to.have.nested.property('samlLogin.provider').that.is.equal('[RelayState]');
				expect(userObject).to.have.nested.property('samlLogin.idp').that.is.equal('[ISSUER]');
				expect(userObject).to.have.nested.property('samlLogin.idpSession').that.is.equal('[SESSIONINDEX]');
				expect(userObject).to.have.nested.property('samlLogin.nameID').that.is.equal('[NAMEID]');
				expect(userObject).to.have.property('emailList').that.is.an('array').that.includes('user1@example.com');
				expect(userObject).to.have.property('username').that.is.equal('user-1');

				const map = new Map();
				map.set('epa', 'group1');
			});
		});
	});
});
