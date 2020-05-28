/* eslint-env mocha */
import 'babel-polyfill';

import assert from 'assert';

import '../../lib/tests/server.mocks.js';
import { AuthorizeRequest } from '../server/lib/generators/AuthorizeRequest';
import { LogoutRequest } from '../server/lib/generators/LogoutRequest';
import { LogoutResponse } from '../server/lib/generators/LogoutResponse';
import { ServiceProviderMetadata } from '../server/lib/generators/ServiceProviderMetadata';

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

	describe('[Metadata]', () => {
		describe('[Metadata.generate]', () => {
			it('should generate a simple metadata file when no certificate info is included', () => {
				const metadata = ServiceProviderMetadata.generate(serviceProviderOptions);

				assert.equal(metadata, `<?xml version="1.0"?>
<EntityDescriptor xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:SAML:2.0:metadata https://docs.oasis-open.org/security/saml/v2.0/saml-schema-metadata-2.0.xsd" xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="[issuer]">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://localhost:3000/_saml/logout/[test-provider]/" ResponseLocation="http://localhost:3000/_saml/logout/[test-provider]/"/>
    <NameIDFormat>email</NameIDFormat>
    <AssertionConsumerService index="1" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="[callback-url]"/>
  </SPSSODescriptor>
</EntityDescriptor>`);
			});

			it('should include additional information when a certificate is provided', () => {
				const customOptions = {
					...serviceProviderOptions,
					privateCert: '[CERTIFICATE_CONTENT]',
					privateKey: '[PRIVATE_KEY]',
				};

				const metadata = ServiceProviderMetadata.generate(customOptions);
				assert.equal(metadata, `<?xml version="1.0"?>
<EntityDescriptor xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:SAML:2.0:metadata https://docs.oasis-open.org/security/saml/v2.0/saml-schema-metadata-2.0.xsd" xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="[issuer]">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor>
      <ds:KeyInfo>
        <ds:X509Data>
          <ds:X509Certificate>[CERTIFICATE_CONTENT]</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
      <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
      <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/>
      <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#tripledes-cbc"/>
    </KeyDescriptor>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://localhost:3000/_saml/logout/[test-provider]/" ResponseLocation="http://localhost:3000/_saml/logout/[test-provider]/"/>
    <NameIDFormat>email</NameIDFormat>
    <AssertionConsumerService index="1" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="[callback-url]"/>
  </SPSSODescriptor>
</EntityDescriptor>`);
			});
		});
	});
});
