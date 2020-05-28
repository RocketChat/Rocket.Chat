export const serviceProviderOptions = {
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

export const simpleMetadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:SAML:2.0:metadata https://docs.oasis-open.org/security/saml/v2.0/saml-schema-metadata-2.0.xsd" xmlns="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="[issuer]">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://localhost:3000/_saml/logout/[test-provider]/" ResponseLocation="http://localhost:3000/_saml/logout/[test-provider]/"/>
    <NameIDFormat>email</NameIDFormat>
    <AssertionConsumerService index="1" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="[callback-url]"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

export const metadataWithCertificate = `<?xml version="1.0"?>
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
</EntityDescriptor>`;

export const invalidXml = 'not a xml file';

export const randomXml = `<?xml version="1.0"?>
<Document>
	<Element Attribute="Value" />
	<AnotherElement>Value</AnotherElement>
</Document>`;

export const simpleLogoutRequest = `<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_e9c0751f722b4506c667d634a7c28126cdbfa80118" Version="2.0" IssueInstant="[INSTANT]" Destination="http://localhost:3000/_saml/logout/test-sp/" NotOnOrAfter="[NotOnOrAfter]">
	<saml:Issuer>http://localhost:8080/simplesaml/saml2/idp/metadata.php</saml:Issuer>
	<saml:NameID SPNameQualifier="http://localhost:3000/_saml/metadata/test-sp" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">_ab7e1d9a603473e92148d569d50176bafa60bcb2e9</saml:NameID>
	<samlp:SessionIndex>_d6ad0e25459aaddd0433a81e159aa79e55dc52c280</samlp:SessionIndex>
</samlp:LogoutRequest>`;

export const invalidLogoutRequest = `<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_e9c0751f722b4506c667d634a7c28126cdbfa80118" Version="2.0" IssueInstant="[INSTANT]" Destination="http://localhost:3000/_saml/logout/test-sp/" NotOnOrAfter="[NotOnOrAfter]">
	<saml:Issuer>http://localhost:8080/simplesaml/saml2/idp/metadata.php</saml:Issuer>
	<samlp:SessionIndex>_d6ad0e25459aaddd0433a81e159aa79e55dc52c280</samlp:SessionIndex>
</samlp:LogoutRequest>`;
