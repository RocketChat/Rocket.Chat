/* eslint-env mocha */
import 'babel-polyfill';

import assert from 'assert';

import '../../lib/tests/server.mocks.js';
import { AuthorizeRequest } from '../server/lib/generators/AuthorizeRequest';
import { LogoutRequest } from '../server/lib/generators/LogoutRequest';
import { LogoutResponse } from '../server/lib/generators/LogoutResponse';

const serviceProviderOptions = {
	provider: '[test-provider]',
	entryPoint: '[entry-point]',
	idpSLORedirectURL: '[idpSLORedirectURL]',
	issuer: '[issuer]',
	cert: '',
	privateCert: '',
	privateKey: '',
	customAuthnContext: 'Password',
	authnContextComparison: 'Whatever',
	defaultUserRole: 'user',
	roleAttributeName: 'role',
	roleAttributeSync: false,
	allowedClockDrift: 0,
	signatureValidationType: 'All',
	identifierFormat: 'email',
	nameIDPolicyTemplate: '<NameID IdentifierFormat="__identifierFormat__"/>',
	authnContextTemplate: '<authnContext Comparison="__authnContextComparison__">__authnContext__</authnContext>',
	authRequestTemplate: '<authRequest>__identifierFormatTag__ __authnContextTag__ </authRequest>',
	logoutResponseTemplate: '[logout-response-template]',
	logoutRequestTemplate: '[logout-request-template]',
	callbackUrl: '[callback-url]',
};

describe('SAML', () => {
	describe('[AuthorizeRequest]', () => {
		describe('AuthorizeRequest.generate', () => {
			it('should use the custom templates to generate the request', () => {
				const authorizeRequest = AuthorizeRequest.generate(serviceProviderOptions);
				assert.equal(authorizeRequest.request, '<authRequest><NameID IdentifierFormat="email"/> <authnContext Comparison="Whatever">Password</authnContext> </authRequest>');
			});

			it('should include the unique ID on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					authRequestTemplate: '__uniqueId__',
				};

				const authorizeRequest = AuthorizeRequest.generate(customOptions);
				assert.equal(authorizeRequest.request, authorizeRequest.id);
			});

			it('should include the custom options on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					authRequestTemplate: '__callbackUrl__ __entryPoint__ __issuer__',
				};

				const authorizeRequest = AuthorizeRequest.generate(customOptions);
				assert.equal(authorizeRequest.request, '[callback-url] [entry-point] [issuer]');
			});
		});
	});

	describe('[LogoutRequest]', () => {
		describe('LogoutRequest.generate', () => {
			it('should use the custom template to generate the request', () => {
				const logoutRequest = LogoutRequest.generate(serviceProviderOptions, 'NameID', 'sessionIndex');
				assert.equal(logoutRequest.request, '[logout-request-template]');
			});

			it('should include the unique ID on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutRequestTemplate: '__uniqueId__',
				};

				const logoutRequest = LogoutRequest.generate(customOptions, 'NameID', 'sessionIndex');
				assert.equal(logoutRequest.request, logoutRequest.id);
			});

			it('should include the custom options on the request', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutRequestTemplate: '__idpSLORedirectURL__ __issuer__ __identifierFormat__ __nameID__ __sessionIndex__',
				};

				const logoutRequest = LogoutRequest.generate(customOptions, 'NameID', 'sessionIndex');
				assert.equal(logoutRequest.request, '[idpSLORedirectURL] [issuer] email NameID sessionIndex');
			});
		});
	});

	describe('[LogoutResponse]', () => {
		describe('LogoutResponse.generate', () => {
			it('should use the custom template to generate the response', () => {
				const logoutResponse = LogoutResponse.generate(serviceProviderOptions);
				assert.equal(logoutResponse.response, '[logout-response-template]');
			});

			it('should include the unique ID on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__uniqueId__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions);
				assert.equal(logoutResponse.response, logoutResponse.id);
			});

			it('should include the custom options on the response', () => {
				const customOptions = {
					...serviceProviderOptions,
					logoutResponseTemplate: '__idpSLORedirectURL__ __issuer__',
				};

				const logoutResponse = LogoutResponse.generate(customOptions);
				assert.equal(logoutResponse.response, '[idpSLORedirectURL] [issuer]');
			});
		});
	});
});
