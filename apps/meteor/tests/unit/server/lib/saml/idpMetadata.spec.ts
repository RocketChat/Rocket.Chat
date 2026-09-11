import { expect } from 'chai';
import { describe, it } from 'mocha';

import { InvalidIdpMetadataError, parseIdpMetadata } from '../../../../../server/lib/saml/lib/parsers/IdpMetadata';

// Real self-signed cert (CN=idp.test) — the parser validates X.509, so fixtures must be real certs.
const TEST_CERT =
	'MIIDBzCCAe+gAwIBAgIUZhaSm8CbG7FmgCQ2wi7+HLFQMokwDQYJKoZIhvcNAQELBQAwEzERMA8GA1UEAwwIaWRwLnRlc3QwHhcNMjYwNzE4MTk1NzIwWhcNMzYwNzE1MTk1NzIwWjATMREwDwYDVQQDDAhpZHAudGVzdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALbr9h69QN4dqnBTjnV7lWotx4FN2cktfL0Y2qVwQjw3q+OylaKCzio7Kvp2V2sQDsKDNgJnsLLP5TNjWqkXCfbbXRP/Iz3xlyyOoLNYJrZA4Sqn9/dFy6Chq5FSrMTwzqPCxx3nVDy/EpGUMknG7p3B0Ix18YFxQLsN5a/MpZXslrCusdl2LLnYkp6ztp44ZZlXHIaQhzeGnAZqzshvARAY9Ur41h4nSzpCgKVGACSi4LWRJeLc8/IXF+JM2MOR4GInCQLb1z31QPRRZ+3yWH3vKIfZ5YkPF6T0uPYw3hmhe0p7ECdOcSfckyeNT0WnvT8WKmeuOAnmmfqYPtgGBrkCAwEAAaNTMFEwHQYDVR0OBBYEFKQ/LDp2SiRg1jnOLLn/EkunXgaSMB8GA1UdIwQYMBaAFKQ/LDp2SiRg1jnOLLn/EkunXgaSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBACGBYnhbQXkSTerNUN0Wu2sy1MfFUzMYTP3SaXaCMJQhlZXUxtnu1PYTuqCgNkgaiV6b/KUBLVkqX4BaDmP0O5SI3di/uYlAJsBUsDCdaXToKsnjpf9tMvci2TGmPMZMDx9Jbr37G0NR9vewTOFvTkcjBQoXVu5oFbr75EDmxu3hqe8KHiavnX8C57zzpZ8kn37ScP+0Zadu0VYCtKEzfNKp48rCOF3BtYugGcxQWdcvbqurNF9Fyk9laSl8cTLHFeDe6zdWig32n3nHzhANOcezQ/wsUY5XUfUpRUl90rend7zqNq0tFZzOiZDl1MjCs7HCYtTRKEkuwlxgXdvP5Tg=';

// Second distinct self-signed cert (CN=idp2.test), generated the same way, used to prove
// document-order-first selection among multiple KeyDescriptors.
const TEST_CERT_2 =
	'MIIDCTCCAfGgAwIBAgIUS4xN3PfQV0ROnf5nSMMFrN90pmQwDQYJKoZIhvcNAQELBQAwFDESMBAGA1UEAwwJaWRwMi50ZXN0MB4XDTI2MDcxODIwMTAzN1oXDTM2MDcxNTIwMTAzN1owFDESMBAGA1UEAwwJaWRwMi50ZXN0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvAdfR0s3uE/Rnv59RRTwNRuYVTgJoBMoP+xxMhlm8FfZZTsBqv3vt2eqyLaxnChpS+UWnpf56zZpFrNgEAH+dEFPIkhqRL7nUmKSOCXu3nCTS5K03PEWJzbWcjgtbZ6A7Q7BE9bRmBqkkbUi22XQML06A2GIzPE8xliVhnYH5q4GRNIYf6Eh0eV88XZrsXvYgHC46/O/MUMLV5a6tCq2SPvbBKJSI01YQcE/W/C7NtiHUnmkpvWFrJ7Wn2akAwVeA8rL5SJ2rMbO1CB9JgaspjOGdkLqRc2LsZDO2Fmsk1BS6EGaEnxFIggq/LwQmdeu0nK8bmwLZOAB1MgGXbBq/wIDAQABo1MwUTAdBgNVHQ4EFgQUfgd/rj1KGMuiBR7byOQU0zl/bAMwHwYDVR0jBBgwFoAUfgd/rj1KGMuiBR7byOQU0zl/bAMwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAGxdEIVNeoN+BV82FbNGmFPXiQRO1FZk0pUqPczQ5TbN8XvTFWfY2YeawgVn0ec6+eA1M97znDAM5KPF+9RHdk5HRrjS+BX+uJcFKlbWEbZJShk4PookxLq6ELZQ5HPSGgGvyqSueeAI0RMg6aBcZOIzsVJduSeOQNAmkvppN6rTryFVBHvkyI9qYLu9bxZW/BvyUfXmvU+yPRDa98s/WzQowIKktNPTCoxwn6KfGLlmeH5nm9ra48aRKFCXuSVhiuph3lmD4IfbUDYijpfe3kLsmp1Up9bhVH7WUiyT/sD2NFBZp60UAohjWGolNXhosrUOELBiZVuR75gvLmLFV5Q==';

const REDIRECT = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';
const POST = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';

const keyDescriptor = (cert: string, use = 'signing') => `
	<KeyDescriptor${use ? ` use="${use}"` : ''}>
		<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
			<ds:X509Data><ds:X509Certificate>${cert}</ds:X509Certificate></ds:X509Data>
		</ds:KeyInfo>
	</KeyDescriptor>`;

const metadata = ({
	keys = keyDescriptor(TEST_CERT),
	slo = `<SingleLogoutService Binding="${REDIRECT}" Location="https://idp.test/slo"/>`,
	sso = `<SingleSignOnService Binding="${REDIRECT}" Location="https://idp.test/sso"/>`,
	nameIdFormats = '',
} = {}) => `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.test/metadata">
	<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
		${keys}
		${nameIdFormats}
		${slo}
		${sso}
	</IDPSSODescriptor>
</EntityDescriptor>`;

describe('parseIdpMetadata', () => {
	it('extracts cert, entry point and SLO url from typical metadata', () => {
		const result = parseIdpMetadata(metadata());
		expect(result.cert).to.be.a('string').and.to.include(TEST_CERT.substring(0, 40));
		expect(result.entryPoint).to.equal('https://idp.test/sso');
		expect(result.idpSLORedirectURL).to.equal('https://idp.test/slo');
		expect(result.warnings).to.deep.equal([]);
	});

	it('omits the SLO url without warning when metadata has no SingleLogoutService', () => {
		const result = parseIdpMetadata(metadata({ slo: '' }));
		expect(result.idpSLORedirectURL).to.be.undefined;
		expect(result.entryPoint).to.equal('https://idp.test/sso');
		expect(result.warnings).to.not.include('SAML_Metadata_warning_no_slo_redirect_binding');
	});

	it('uses the first signing cert (document order) and warns when there are multiple', () => {
		const result = parseIdpMetadata(metadata({ keys: keyDescriptor(TEST_CERT) + keyDescriptor(TEST_CERT_2) }));
		expect(result.cert).to.be.a('string').and.to.include(TEST_CERT.substring(0, 40));
		expect(result.cert).to.not.include(TEST_CERT_2.substring(0, 40));
		expect(result.warnings).to.include('SAML_Metadata_warning_multiple_certs');
	});

	it('accepts a KeyDescriptor without a use attribute', () => {
		const result = parseIdpMetadata(metadata({ keys: keyDescriptor(TEST_CERT, '') }));
		expect(result.cert).to.be.a('string');
	});

	it('skips a KeyDescriptor whose content is not a valid X.509 certificate and warns', () => {
		const result = parseIdpMetadata(metadata({ keys: keyDescriptor('aGVsbG8gd29ybGQ=') }));
		expect(result.cert).to.be.undefined;
		expect(result.warnings).to.include('SAML_Metadata_warning_no_valid_cert');
	});

	it('does not warn about multiple certs when only one of them is valid', () => {
		const result = parseIdpMetadata(metadata({ keys: keyDescriptor('aGVsbG8gd29ybGQ=') + keyDescriptor(TEST_CERT_2) }));
		expect(result.cert).to.be.a('string').and.to.include(TEST_CERT_2.substring(0, 40));
		expect(result.warnings).to.not.include('SAML_Metadata_warning_multiple_certs');
		expect(result.warnings).to.not.include('SAML_Metadata_warning_no_valid_cert');
	});

	it('warns that no valid cert was found when every KeyDescriptor is invalid', () => {
		const result = parseIdpMetadata(metadata({ keys: keyDescriptor('aGVsbG8gd29ybGQ=') + keyDescriptor('bm90IGEgY2VydA==') }));
		expect(result.cert).to.be.undefined;
		expect(result.warnings).to.include('SAML_Metadata_warning_no_valid_cert');
		expect(result.warnings).to.not.include('SAML_Metadata_warning_multiple_certs');
	});

	it('omits the entry point when only HTTP-POST SSO bindings exist', () => {
		const result = parseIdpMetadata(metadata({ sso: `<SingleSignOnService Binding="${POST}" Location="https://idp.test/sso-post"/>` }));
		expect(result.entryPoint).to.be.undefined;
		expect(result.warnings).to.include('SAML_Metadata_warning_no_redirect_binding');
	});

	it('skips a Redirect SSO service with an invalid Location and uses the next valid one', () => {
		const sso = `
			<SingleSignOnService Binding="${REDIRECT}" Location="not a url"/>
			<SingleSignOnService Binding="${REDIRECT}" Location="https://idp.test/sso-2"/>`;
		const result = parseIdpMetadata(metadata({ sso }));
		expect(result.entryPoint).to.equal('https://idp.test/sso-2');
		expect(result.warnings).to.not.include('SAML_Metadata_warning_no_redirect_binding');
	});

	it('omits the entry point and warns when the only Redirect SSO Location is not http(s)', () => {
		const sso = `<SingleSignOnService Binding="${REDIRECT}" Location="javascript:alert(1)"/>`;
		const result = parseIdpMetadata(metadata({ sso }));
		expect(result.entryPoint).to.be.undefined;
		expect(result.warnings).to.include('SAML_Metadata_warning_no_redirect_binding');
	});

	it('omits the SLO url and warns when no SingleLogoutService uses the HTTP-Redirect binding', () => {
		const slo = `<SingleLogoutService Binding="${POST}" Location="https://idp.test/slo-post"/>`;
		const result = parseIdpMetadata(metadata({ slo }));
		expect(result.idpSLORedirectURL).to.be.undefined;
		expect(result.warnings).to.include('SAML_Metadata_warning_no_slo_redirect_binding');
	});

	it('picks the Redirect SingleLogoutService even when a POST one comes first', () => {
		const slo = `
			<SingleLogoutService Binding="${POST}" Location="https://idp.test/slo-post"/>
			<SingleLogoutService Binding="${REDIRECT}" Location="https://idp.test/slo-redirect"/>`;
		const result = parseIdpMetadata(metadata({ slo }));
		expect(result.idpSLORedirectURL).to.equal('https://idp.test/slo-redirect');
		expect(result.warnings).to.not.include('SAML_Metadata_warning_no_slo_redirect_binding');
	});

	it('ignores services nested under Extensions instead of declared directly on the descriptor', () => {
		const sso = `
			<Extensions>
				<SingleSignOnService Binding="${REDIRECT}" Location="https://attacker.test/sso"/>
				<SingleLogoutService Binding="${REDIRECT}" Location="https://attacker.test/slo"/>
			</Extensions>
			<SingleSignOnService Binding="${REDIRECT}" Location="https://idp.test/sso"/>`;
		const result = parseIdpMetadata(metadata({ sso, slo: '' }));
		expect(result.entryPoint).to.equal('https://idp.test/sso');
		expect(result.idpSLORedirectURL).to.be.undefined;
	});

	it('omits the entry point and warns when there is no SingleSignOnService element at all', () => {
		const result = parseIdpMetadata(metadata({ sso: '' }));
		expect(result.entryPoint).to.be.undefined;
		expect(result.warnings).to.include('SAML_Metadata_warning_no_redirect_binding');
	});

	it('extracts the NameIDFormat', () => {
		const result = parseIdpMetadata(
			metadata({ nameIdFormats: '<NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress</NameIDFormat>' }),
		);
		expect(result.identifierFormat).to.equal('urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress');
		expect(result.warnings).to.not.include('SAML_Metadata_warning_multiple_nameid_formats');
	});

	it('uses the first NameIDFormat (document order) and warns when there are multiple', () => {
		const nameIdFormats = `
			<NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress</NameIDFormat>
			<NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</NameIDFormat>`;
		const result = parseIdpMetadata(metadata({ nameIdFormats }));
		expect(result.identifierFormat).to.equal('urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress');
		expect(result.warnings).to.include('SAML_Metadata_warning_multiple_nameid_formats');
	});

	it('picks the SAML 2.0 role when another protocol comes first', () => {
		const mixedRoles = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://mixed.test">
	<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:1.1:protocol">
		<SingleSignOnService Binding="urn:mace:shibboleth:1.0:profiles:AuthnRequest" Location="https://mixed.test/saml1/sso"/>
	</IDPSSODescriptor>
	<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:1.1:protocol urn:oasis:names:tc:SAML:2.0:protocol">
		<SingleSignOnService Binding="${REDIRECT}" Location="https://mixed.test/saml2/sso"/>
	</IDPSSODescriptor>
</EntityDescriptor>`;
		const result = parseIdpMetadata(mixedRoles);
		expect(result.entryPoint).to.equal('https://mixed.test/saml2/sso');
	});

	it('rejects metadata whose only IDPSSODescriptor does not support SAML 2.0', () => {
		const saml1Only = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://saml1.test">
	<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:1.1:protocol">
		<SingleSignOnService Binding="${REDIRECT}" Location="https://saml1.test/sso"/>
	</IDPSSODescriptor>
</EntityDescriptor>`;
		expect(() => parseIdpMetadata(saml1Only)).to.throw(InvalidIdpMetadataError);
	});

	it('rejects SP-only metadata (no IDPSSODescriptor)', () => {
		const spOnly = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://sp.test">
	<SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"/>
</EntityDescriptor>`;
		expect(() => parseIdpMetadata(spOnly)).to.throw(InvalidIdpMetadataError);
	});

	it('rejects a document whose root is not EntityDescriptor', () => {
		expect(() => parseIdpMetadata('<html><body>nope</body></html>')).to.throw(InvalidIdpMetadataError);
	});

	it('rejects a federation aggregate wrapping EntityDescriptors', () => {
		const aggregate = `<?xml version="1.0"?>
<EntitiesDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
	<EntityDescriptor entityID="https://idp.test/metadata">
		<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
			<SingleSignOnService Binding="${REDIRECT}" Location="https://idp.test/sso"/>
		</IDPSSODescriptor>
	</EntityDescriptor>
</EntitiesDescriptor>`;
		expect(() => parseIdpMetadata(aggregate)).to.throw(InvalidIdpMetadataError);
	});

	it('rejects an otherwise-valid document with an unclosed inner element', () => {
		// xmldom auto-closes the unclosed <ds:KeyInfo> into a structurally-complete document (every guard
		// passes), so this only throws because the parser treats the `warning` it emits as fatal.
		const unclosedInner = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.test/metadata">
	<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
		<KeyDescriptor use="signing">
			<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
				<ds:X509Data><ds:X509Certificate>${TEST_CERT}</ds:X509Certificate></ds:X509Data>
		</KeyDescriptor>
		<SingleLogoutService Binding="${REDIRECT}" Location="https://idp.test/slo"/>
		<SingleSignOnService Binding="${REDIRECT}" Location="https://idp.test/sso"/>
	</IDPSSODescriptor>
</EntityDescriptor>`;
		expect(() => parseIdpMetadata(unclosedInner)).to.throw(InvalidIdpMetadataError);
	});
});
