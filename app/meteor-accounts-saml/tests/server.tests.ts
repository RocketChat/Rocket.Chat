/* eslint-env mocha */
import 'babel-polyfill';

import assert from 'assert';

import '../../lib/tests/server.mocks.js';
import { AuthorizeRequest } from '../server/lib/generators/AuthorizeRequest';

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
};

describe('SAML', () => {
	describe('[Authorize]', () => {
		describe('Authorize.generate', () => {
			it('should use the custom templates to generate the request', () => {
				const authorizeRequest = AuthorizeRequest.generate(serviceProviderOptions, 'test.host');
				assert.equal(authorizeRequest.request, '<authRequest><NameID IdentifierFormat="email"/> <authnContext Comparison="Whatever">Password</authnContext> </authRequest>');
			});
		});
	});
});
