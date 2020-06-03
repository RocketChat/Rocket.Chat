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
	metadataCertificateTemplate: '',
	metadataTemplate: '',
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

export const simpleLogoutResponse = `<samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_804853615e31dd9b2fb54a71faa09d95a370003574" Version="2.0" IssueInstant="[INSTANT]" Destination="http://localhost:3000/_saml/logout/test-sp/" InResponseTo="_id-6530db3fcd23dc42a31c">
	<saml:Issuer>[IssuerName]</saml:Issuer>
	<samlp:Status>
		<samlp:StatusCode Value="[STATUSCODE]"/>
	</samlp:Status>
</samlp:LogoutResponse>`;

export const invalidLogoutResponse = `<samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_804853615e31dd9b2fb54a71faa09d95a370003574" Version="2.0" IssueInstant="[INSTANT]" Destination="http://localhost:3000/_saml/logout/test-sp/" InResponseTo="_id-6530db3fcd23dc42a31c">
	<saml:Issuer>[IssuerName]</saml:Issuer>
</samlp:LogoutResponse>`;


const samlResponseStatus = `<samlp:Status>
		<samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
	</samlp:Status>`;

const samlResponseAssertion = `<saml:Assertion ID="_cad47813d7242e43b4730b5c7bfd57de3639c8b047" IssueInstant="2020-05-28T21:39:37Z" Version="2.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<saml:Issuer>[ISSUER]</saml:Issuer>
		<saml:Subject>
			<saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient" SPNameQualifier="http://localhost:3000/_saml/metadata/test-sp">[NAMEID]</saml:NameID>
		</saml:Subject>
		<saml:AuthnStatement AuthnInstant="2020-05-28T21:39:37Z" SessionIndex="[SESSIONINDEX]" SessionNotOnOrAfter="2020-05-29T05:39:37Z">
			<saml:AuthnContext>
				<saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef>
			</saml:AuthnContext>
		</saml:AuthnStatement>
		<saml:AttributeStatement>
			<saml:Attribute Name="uid" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">1</saml:AttributeValue>
			</saml:Attribute>
			<saml:Attribute Name="eduPersonAffiliation" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">group1</saml:AttributeValue>
			</saml:Attribute>
			<saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">user1@example.com</saml:AttributeValue>
			</saml:Attribute>
		</saml:AttributeStatement>
	</saml:Assertion>`;

const samlResponseHeader = '<samlp:Response Destination="http://localhost:3000/_saml/validate/test-sp" ID="_f58e6bce78eac527058e0e4c0230aa4765831a5437" InResponseTo="[INRESPONSETO]" IssueInstant="2020-05-28T21:39:37Z" Version="2.0" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">';
const samlResponseFooter = '</samlp:Response>';
const samlResponseIssuer = '<saml:Issuer>[ISSUER]</saml:Issuer>';

export const simpleSamlResponse = `${ samlResponseHeader }
	${ samlResponseIssuer }
	${ samlResponseStatus }
	${ samlResponseAssertion }
${ samlResponseFooter }`;

export const samlResponseMissingStatus = `${ samlResponseHeader }
	${ samlResponseIssuer }
	${ samlResponseAssertion }
${ samlResponseFooter }`;

export const samlResponseMissingAssertion = `${ samlResponseHeader }
	${ samlResponseIssuer }
	${ samlResponseStatus }
${ samlResponseFooter }`;

export const samlResponseFailedStatus = `${ samlResponseHeader }
	${ samlResponseIssuer }
	<samlp:Status>
		<samlp:StatusCode Value="Failed"/>
	</samlp:Status>
	${ samlResponseAssertion }
${ samlResponseFooter }`;

export const samlResponseMultipleAssertions = `${ samlResponseHeader }
	${ samlResponseIssuer }
	${ samlResponseStatus }
	${ samlResponseAssertion }
	${ samlResponseAssertion }
${ samlResponseFooter }`;

export const samlResponseMultipleIssuers = `${ samlResponseHeader }
	${ samlResponseIssuer }
	${ samlResponseStatus }
	<saml:Assertion ID="_cad47813d7242e43b4730b5c7bfd57de3639c8b047" IssueInstant="2020-05-28T21:39:37Z" Version="2.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		<saml:Issuer>[ISSUER]</saml:Issuer>
		<saml:Issuer>[ISSUER]</saml:Issuer>
		<saml:Subject>
			<saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient" SPNameQualifier="http://localhost:3000/_saml/metadata/test-sp">[NAMEID]</saml:NameID>
		</saml:Subject>
		<saml:AuthnStatement AuthnInstant="2020-05-28T21:39:37Z" SessionIndex="[SESSIONINDEX]" SessionNotOnOrAfter="2020-05-29T05:39:37Z">
			<saml:AuthnContext>
				<saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef>
			</saml:AuthnContext>
		</saml:AuthnStatement>
		<saml:AttributeStatement>
			<saml:Attribute Name="uid" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">1</saml:AttributeValue>
			</saml:Attribute>
			<saml:Attribute Name="eduPersonAffiliation" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">group1</saml:AttributeValue>
			</saml:Attribute>
			<saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">user1@example.com</saml:AttributeValue>
			</saml:Attribute>
		</saml:AttributeStatement>
	</saml:Assertion>
${ samlResponseFooter }`;

const samlResponseSignature = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
		<ds:SignedInfo>
			<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
			<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
			<ds:Reference URI="#_f58e6bce78eac527058e0e4c0230aa4765831a5437">
				<ds:Transforms>
					<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
					<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
				</ds:Transforms>
				<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
				<ds:DigestValue>S2qmjxIC0ncXw+7n6ptxy9p24oc=</ds:DigestValue>
			</ds:Reference>
		</ds:SignedInfo>
		<ds:SignatureValue>ECRjbLzq2QbPRfhBSJRhjCR/3hxt/uUN8zjUmBIN2LMvytG8FGsuWzC57pVMDBNpwdKKSwv0U1PieLWU9tMoESKGOhoHLzK4w9otlhgQDfy9qjqYBVv9Bp67D2Tx+dU2S11y2GnKH749fbNnmASYynQumkFxB6nunaCNXmVu842PK0jlJQUufOCb4nMZZHgK6RYir49K8lROXqHn02+L0iJAxJggr5eWHftBsxJWh32pE0T5DTuhu9qm8sq5aSSl5ybJhE9N4L1TOXmWmgeM8qa/MwV4+sNDKIKo32EbLeo1ybEmg9GEzo2vakm5zcFYALxt5egtx29iSrX2qIH75Q==</ds:SignatureValue>
		<ds:KeyInfo>
			<ds:X509Data>
				<ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate>
			</ds:X509Data>
		</ds:KeyInfo>
	</ds:Signature>`;

const samlResponseFullAssertion = `<saml:Assertion ID="_cad47813d7242e43b4730b5c7bfd57de3639c8b047" IssueInstant="2020-05-28T21:39:37Z" Version="2.0" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		${ samlResponseIssuer }
		<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
			<ds:SignedInfo>
				<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
				<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
				<ds:Reference URI="#_cad47813d7242e43b4730b5c7bfd57de3639c8b047">
					<ds:Transforms>
						<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
						<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
					</ds:Transforms>
					<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
					<ds:DigestValue>7VshRWNbgdIesGGSQiwS7tuhkzg=</ds:DigestValue>
				</ds:Reference>
			</ds:SignedInfo>
			<ds:SignatureValue>EYVTttrq3Yxkp/I+U271CYKpeYMHPEb9oZm/ZKyGzCkMI8GNvwh7YOhT/+M7NwLOVjpdvAZlXQFeyxearlVDgPvyZtUNz8LwpnQEu5LkV8jxzQczW+x71OnantwKecpz3eyAEvvEjjWtZf1m8IoH5UtGVqW6SzIkxWN2ixudRInAUMgSq7IXp0x1BjL4N69Y3IsW48PCdKTpuAcsdefvsR8tLgeWOk3smigfsu72Sp5sVh/n3AHiCXJ5fgLYfLiY8cXwQzZ8JSjFp7H2lyrl0Tth2TCBe1DemBRzCQ2t2ZbAjwUrsI1Xy8GAshq1nNplXMSs53HEqSay40USqqTZ9w==</ds:SignatureValue>
			<ds:KeyInfo>
				<ds:X509Data>
					<ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate>
				</ds:X509Data>
			</ds:KeyInfo>
		</ds:Signature>
		<saml:Subject>
			<saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient" SPNameQualifier="http://localhost:3000/_saml/metadata/test-sp">[NAMEID]</saml:NameID>
			<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
				<saml:SubjectConfirmationData InResponseTo="[INRESPONSETO]" NotOnOrAfter="2020-05-28T21:44:37Z" Recipient="http://localhost:3000/_saml/validate/test-sp"/>
			</saml:SubjectConfirmation>
		</saml:Subject>
		<saml:Conditions NotBefore="[NOTBEFORE]" NotOnOrAfter="2020-05-28T21:44:37Z">
			<saml:AudienceRestriction>
				<saml:Audience>http://localhost:3000/_saml/metadata/test-sp</saml:Audience>
			</saml:AudienceRestriction>
		</saml:Conditions>
		<saml:AuthnStatement AuthnInstant="2020-05-28T21:39:37Z" SessionIndex="[SESSIONINDEX]" SessionNotOnOrAfter="2020-05-29T05:39:37Z">
			<saml:AuthnContext>
				<saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef>
			</saml:AuthnContext>
		</saml:AuthnStatement>
		<saml:AttributeStatement>
			<saml:Attribute Name="uid" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">1</saml:AttributeValue>
			</saml:Attribute>
			<saml:Attribute Name="eduPersonAffiliation" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">group1</saml:AttributeValue>
			</saml:Attribute>
			<saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">user1@example.com</saml:AttributeValue>
			</saml:Attribute>
		</saml:AttributeStatement>
	</saml:Assertion>`;

export const samlResponseValidSignatures = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_31dd75023c1537f1016f835db64c18fee89d9db561" Version="2.0" IssueInstant="2020-06-03T17:55:29Z" Destination="http://localhost:3000/_saml/validate/test-sp" InResponseTo="id-L9qm86X4eez8a75G4"><saml:Issuer>http://localhost:8080/simplesaml/saml2/idp/metadata.php</saml:Issuer><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
  <ds:Reference URI="#_31dd75023c1537f1016f835db64c18fee89d9db561"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>afI/fG2Gkj4Nlu5vC+PdYon1aNk=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>Gndt6TSrAaSs/BK84bqVXUMz3cvl34dIpHEZ2o7uqAf66SCF3qjLLm5fV/bFaSMOPwnVNJFjXpxmKdZI9mwBKBMYutxd43wkBvkp+3MYVZcRTpuU2Wo6iQLy9rhScB5MLRMEe3lKpwBRCKGEBUn1V/WaVUWlReHNHtwCnXD6FhtG4PBfd5p4dGePRQxFd9a0Pfm0wN4AposjLNNzGLf8yFTPTmGlZJ44U2IEUlxtOeH0MP7v7yAvwsjOk1PUJcUB4jgM8Y4WPCgEN7ntBdkSH8Q79tS6gyn/gAN9PW8QPcWNf3FVUnRfL8WRUeqUfohTUscRftj4Ff60Ob/FOeoIlQ==</ds:SignatureValue>
<ds:KeyInfo><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" ID="_5c3922424850bfd7b3641effb479a803bbcc967462" Version="2.0" IssueInstant="2020-06-03T17:55:29Z"><saml:Issuer>http://localhost:8080/simplesaml/saml2/idp/metadata.php</saml:Issuer><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
  <ds:Reference URI="#_5c3922424850bfd7b3641effb479a803bbcc967462"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>r9sst6WOPoE361N1KL5Rf2pDFwE=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>p8D+3dBL5+hNtaVnXRMjZ8dFCFH/F1zNhQGSWLK2OPuhWEz/+vA9VgzdcKwH2H72B3Th0dskzRpznznCKYD6NKd9p+RTp9+MFd9xCZ4Aa5gZoiNbk2QcY1Wn30QjyzO3VWbCVcQpFOLJXfNppD/D4aTk8CH+elow+jFDimAIJQ4Y/w0Pzb9ANZpkxUFcBpCZPZ7b1YSgR2O5R7xmT/6x9PyQXqVJ595a7SmDMYzAL6SOfwz9QiJGpdX3WWVKB9lnLEnSjLIb9YV0Acv8+zAuTy7k6oBr428byR8LJbJUGe0a59gxgK5Oia9cmsu8WnCqGwyvFTjPCyq9dhz/9IZL5A==</ds:SignatureValue>
<ds:KeyInfo><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature><saml:Subject><saml:NameID SPNameQualifier="http://id.init8.net:8080/openam" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">_d19335ecd7687bf141b820e91a8dc95d54a2ae1d8e</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="2020-06-03T18:00:29Z" Recipient="http://localhost:3000/_saml/validate/test-sp" InResponseTo="id-L9qm86X4eez8a75G4"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="2020-06-03T17:54:59Z" NotOnOrAfter="2020-06-03T18:00:29Z"><saml:AudienceRestriction><saml:Audience>http://localhost:3000/_saml/metadata/test-sp</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="2020-06-03T17:48:08Z" SessionNotOnOrAfter="2020-06-04T01:48:08Z" SessionIndex="_b92afb5670a1f55817b50da392e9e45aa5b2cdd611"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="uid" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">1</saml:AttributeValue></saml:Attribute><saml:Attribute Name="eduPersonAffiliation" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">group1</saml:AttributeValue></saml:Attribute><saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">user1@example.com</saml:AttributeValue></saml:Attribute><saml:Attribute Name="channels" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">channel1</saml:AttributeValue><saml:AttributeValue xsi:type="xs:string">pets</saml:AttributeValue><saml:AttributeValue xsi:type="xs:string">random</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`;

export const samlResponseValidAssertionSignature = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_31dd75023c1537f1016f835db64c18fee89d9db561" Version="2.0" IssueInstant="2020-06-03T17:55:29Z" Destination="http://localhost:3000/_saml/validate/test-sp" InResponseTo="id-L9qm86X4eez8a75G4"><saml:Issuer>http://localhost:8080/simplesaml/saml2/idp/metadata.php</saml:Issuer><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
  <ds:Reference URI="#_31dd75023c1537f1016f835db64c18fee89d9db561"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>afI/fG2Gkj4Nlu5vC+PdYon1aNk=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>invalid signature</ds:SignatureValue>
<ds:KeyInfo><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" ID="_5c3922424850bfd7b3641effb479a803bbcc967462" Version="2.0" IssueInstant="2020-06-03T17:55:29Z"><saml:Issuer>http://localhost:8080/simplesaml/saml2/idp/metadata.php</saml:Issuer><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
  <ds:Reference URI="#_5c3922424850bfd7b3641effb479a803bbcc967462"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>r9sst6WOPoE361N1KL5Rf2pDFwE=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>p8D+3dBL5+hNtaVnXRMjZ8dFCFH/F1zNhQGSWLK2OPuhWEz/+vA9VgzdcKwH2H72B3Th0dskzRpznznCKYD6NKd9p+RTp9+MFd9xCZ4Aa5gZoiNbk2QcY1Wn30QjyzO3VWbCVcQpFOLJXfNppD/D4aTk8CH+elow+jFDimAIJQ4Y/w0Pzb9ANZpkxUFcBpCZPZ7b1YSgR2O5R7xmT/6x9PyQXqVJ595a7SmDMYzAL6SOfwz9QiJGpdX3WWVKB9lnLEnSjLIb9YV0Acv8+zAuTy7k6oBr428byR8LJbJUGe0a59gxgK5Oia9cmsu8WnCqGwyvFTjPCyq9dhz/9IZL5A==</ds:SignatureValue>
<ds:KeyInfo><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature><saml:Subject><saml:NameID SPNameQualifier="http://id.init8.net:8080/openam" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">_d19335ecd7687bf141b820e91a8dc95d54a2ae1d8e</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="2020-06-03T18:00:29Z" Recipient="http://localhost:3000/_saml/validate/test-sp" InResponseTo="id-L9qm86X4eez8a75G4"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="2020-06-03T17:54:59Z" NotOnOrAfter="2020-06-03T18:00:29Z"><saml:AudienceRestriction><saml:Audience>http://localhost:3000/_saml/metadata/test-sp</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="2020-06-03T17:48:08Z" SessionNotOnOrAfter="2020-06-04T01:48:08Z" SessionIndex="_b92afb5670a1f55817b50da392e9e45aa5b2cdd611"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="uid" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">1</saml:AttributeValue></saml:Attribute><saml:Attribute Name="eduPersonAffiliation" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">group1</saml:AttributeValue></saml:Attribute><saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">user1@example.com</saml:AttributeValue></saml:Attribute><saml:Attribute Name="channels" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue xsi:type="xs:string">channel1</saml:AttributeValue><saml:AttributeValue xsi:type="xs:string">pets</saml:AttributeValue><saml:AttributeValue xsi:type="xs:string">random</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>`;

export const samlResponse = `${ samlResponseHeader }
	${ samlResponseIssuer }
	${ samlResponseSignature }
	${ samlResponseStatus }
	${ samlResponseFullAssertion }
${ samlResponseFooter }`;

export const duplicatedSamlResponse = `${ simpleSamlResponse }${ simpleSamlResponse }`;

export const profile = {
	issuer: '[IssuerName]',
	sessionIndex: '[SessionIndex]',
	nameID: '[nameID]',
	displayName: '[DisplayName]',
	anotherName: '[AnotherName]',
	username: '[username]',
	anotherUsername: '[AnotherUserName]',
	roles: 'user,ruler,admin,king,president,governor,mayor',
	otherRoles: 'user,customer,client',
	language: 'ptbr',
	channels: 'pets,pics,funny,random,babies',
	multipleChannels: ['pets', 'pics', 'funny', 'random', 'babies'],
	customField1: 'value1',
	customField2: 'value2',
	customField3: 'value3',
	singleEmail: 'testing@server.com',
};

export const certificate = `MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+Cgav
Og8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+
YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc
+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyix
YFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8
jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/C
YQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkw
DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6b
lEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFs
X1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7
yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7
NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG
99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2n
aQ==`;
