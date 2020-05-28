/* eslint-env mocha */
import 'babel-polyfill';

import chai from 'chai';

import '../../lib/tests/server.mocks.js';
import { AuthorizeRequest } from '../server/lib/generators/AuthorizeRequest';
import { LogoutRequest } from '../server/lib/generators/LogoutRequest';
import { LogoutResponse } from '../server/lib/generators/LogoutResponse';
import { ServiceProviderMetadata } from '../server/lib/generators/ServiceProviderMetadata';
import { LogoutRequestParser } from '../server/lib/parsers/LogoutRequest';
import {
	serviceProviderOptions,
	simpleMetadata,
	metadataWithCertificate,
	simpleLogoutRequest,
	invalidXml,
	randomXml,
	invalidLogoutRequest,
} from './data';

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
				const instant = new Date().toISOString();
				const later = new Date();
				later.setMinutes(later.getMinutes() + 3);

				const logoutRequest = simpleLogoutRequest
					.replace('[INSTANT]', instant)
					.replace('[NotOnOrAfter]', later.toISOString());

				const parser = new LogoutRequestParser(serviceProviderOptions);

				parser.validate(logoutRequest, (err, data) => {
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
				const logoutResponse = LogoutResponse.generate(serviceProviderOptions);
				expect(logoutResponse.response).to.be.equal('[logout-response-template]');
			});

			it('should include the unique ID on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__uniqueId__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions);
				expect(logoutResponse.response).to.be.equal(logoutResponse.id);
			});

			it('should include the custom options on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__idpSLORedirectURL__ __issuer__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions);
				expect(logoutResponse.response).to.be.equal('[idpSLORedirectURL] [issuer]');
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
});
