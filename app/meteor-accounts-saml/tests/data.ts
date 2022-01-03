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
			<saml:Attribute Name="channels" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
				<saml:AttributeValue xsi:type="xs:string">channel1</saml:AttributeValue>
				<saml:AttributeValue xsi:type="xs:string">pets</saml:AttributeValue>
				<saml:AttributeValue xsi:type="xs:string">random</saml:AttributeValue>
			</saml:Attribute>
		</saml:AttributeStatement>
	</saml:Assertion>`;

const samlResponseHeader =
	'<samlp:Response Destination="http://localhost:3000/_saml/validate/test-sp" ID="_f58e6bce78eac527058e0e4c0230aa4765831a5437" InResponseTo="[INRESPONSETO]" IssueInstant="2020-05-28T21:39:37Z" Version="2.0" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">';
const samlResponseFooter = '</samlp:Response>';
const samlResponseIssuer = '<saml:Issuer>[ISSUER]</saml:Issuer>';

export const simpleSamlResponse = `${samlResponseHeader}
	${samlResponseIssuer}
	${samlResponseStatus}
	${samlResponseAssertion}
${samlResponseFooter}`;

export const samlResponseMissingStatus = `${samlResponseHeader}
	${samlResponseIssuer}
	${samlResponseAssertion}
${samlResponseFooter}`;

export const samlResponseMissingAssertion = `${samlResponseHeader}
	${samlResponseIssuer}
	${samlResponseStatus}
${samlResponseFooter}`;

export const samlResponseFailedStatus = `${samlResponseHeader}
	${samlResponseIssuer}
	<samlp:Status>
		<samlp:StatusCode Value="Failed"/>
	</samlp:Status>
	${samlResponseAssertion}
${samlResponseFooter}`;

export const samlResponseMultipleAssertions = `${samlResponseHeader}
	${samlResponseIssuer}
	${samlResponseStatus}
	${samlResponseAssertion}
	${samlResponseAssertion}
${samlResponseFooter}`;

export const samlResponseMultipleIssuers = `${samlResponseHeader}
	${samlResponseIssuer}
	${samlResponseStatus}
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
${samlResponseFooter}`;

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
		${samlResponseIssuer}
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

export const samlResponse = `${samlResponseHeader}
	${samlResponseIssuer}
	${samlResponseSignature}
	${samlResponseStatus}
	${samlResponseFullAssertion}
${samlResponseFooter}`;

export const duplicatedSamlResponse = `${simpleSamlResponse}${simpleSamlResponse}`;

export const encryptedResponse = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_5b4a6127022221e262764e9d9ebe70a65eebb479d1" Version="2.0" IssueInstant="2020-06-03T21:49:15Z" Destination="http://localhost:3000/_saml/validate/test-sp" InResponseTo="id-4P5wYktKCyK5ZXurQ"><saml:Issuer>http://localhost:8080/simplesaml/saml2/idp/metadata.php</saml:Issuer><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ds:SignedInfo><ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
  <ds:Reference URI="#_5b4a6127022221e262764e9d9ebe70a65eebb479d1"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>a9/HYUoNaz3fCqNEWASnblQ2Boc=</ds:DigestValue></ds:Reference></ds:SignedInfo><ds:SignatureValue>uj/NBTAqxYarAS+V+in8aQ7/ZoJZapE81HD+v+RR0q5LSRfpFoqy52R6YcSvV4d+eYe365SXpGGHedRVZ9UbzvLyR2XOlopIf/SweFOYXaPBd30W4KxRAlcaauF5kvYjmshDZE0YkGJUcB3x1yNaEyW8UuGA8Bq6be/ytEa6ZRsb2tC/81nR+LOAQwNdfLmsturHDXHSZltobm7MQSLC1oGnS8ha+/7N5laeTWsgQuuYRbUkSP4yTf/2fdg4U5LH7RD/Hhha+kO8geWM/dC1TdME/KtYT7AseHJxAa0CRvOCW2KLACllM24xU/5oLf6Wt447bzQj9Xt2LI9D2g1nNw==</ds:SignatureValue>
<ds:KeyInfo><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></ds:Signature><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:EncryptedAssertion><xenc:EncryptedData xmlns:xenc="http://www.w3.org/2001/04/xmlenc#" xmlns:dsig="http://www.w3.org/2000/09/xmldsig#" Type="http://www.w3.org/2001/04/xmlenc#Element"><xenc:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/><dsig:KeyInfo xmlns:dsig="http://www.w3.org/2000/09/xmldsig#"><xenc:EncryptedKey><xenc:EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p"/><xenc:CipherData><xenc:CipherValue>jVRjHcdQc21xw0vRKUDtPScv+GPY6mxOJiPmiaBFxBkrCDHjlfLmcOi8badR5ZPiloDFfEc9SSVkqEOoJLVHNttnpWxTxP6ySwSD4hD1yAyDm/YBQkQkMkNVsRB9dBkXSx15g9wQk13zfcjzaLIohWqAdau4ISaWyObmMDZjDS8tLa9vE93e/VPwVp8rB/lSDn9OMymtZHWmPHkR7tB6zYGGgusUeUujb4d9LJ795nLst++0QQHbh0C78BvCwV9fUoK8WPBfwVLnSDM15pbWsFPUCwvziBdCh/jQX92S2aeMXbiNWmIsVT3IacItKjYlbHaAFCEfmGQP0ALOg3cFlw==</xenc:CipherValue></xenc:CipherData></xenc:EncryptedKey></dsig:KeyInfo>
   <xenc:CipherData>
      <xenc:CipherValue>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</xenc:CipherValue>
   </xenc:CipherData>
</xenc:EncryptedData></saml:EncryptedAssertion></samlp:Response>`;

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

export const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCi8vclbfAabX0D
LRQYqXCTiJVL+I2uAViMuZxTbxY8Yzx+FKFjSyqitMUycpuEaM7+DMkb3S7fx3MH
7Bbpq9UJ0CB8zFi+Y174TLQmncdtegl8DmhYTOoPqSHBDP5m/gH/0KJuCB7fHbf5
aMBHOMMUMnJnJ3QliRLFeDjFj/I/SzvQL+QIkqkaEf0kXuQ1E2lvdgvvJFved19M
U0d5ao9WKmtDYiQEDTM+BhY74UXHUFRvHj23LpqYkwYX6HJ+a/LRfrT0rbV86+YJ
nR/PkKgNTl7wtRU1kcKgyaip/sFQwFPOVUrMlWd/Ejm/Eh0MFv6UricyLYBCbyp8
C9cWHVrBAgMBAAECggEAFhgHdqW/ZnXt+15DWUywHPDp/VEINM2t6fbIwW9QfoOe
EiJN956be1AzZLGxcHSdjEjDg+mrj2AFss9KFAjea+QyY3l5lub2W4ha7Nl7ztY7
LvztHPvgyJrQHtLaM7DBKKRrQawMM4heB40ydPW3TafBZ0csMmKxjuDMIc1wtTAQ
2wb2MQt7QwO7H5he/JNArgMOAmZvkPowqIqL/YsWfVz0TdiPgQ8t1JZxBavwMZkn
+wE47aVN+K0ksy67pF5DDtygyMydSJV8iGWRbe9VQqsOwpjNYbGfDiTT7+wsANJm
nTwNQ0vWwzBSA04aRv/40L9cyR642JHV1kg5GZGB2QKBgQDNTHitGmFkAvH+1/zo
JXrSCe3J3xMxTOzSBKOU7B8Fr1VAVh1EcVGEG3/1FB2eyXB4sgtaSDkMdltvV/Ml
ZxnlTTcTPtTNgABofKGQOx0kOdDargM8n+zzuQ0cRTjobpusR2LIKJCllmLM2Q2g
9rsSX/j1tM8KmE2SeJ+9w8s7zwKBgQDLMQm/QZOAQB7zxgfLZ0jtGMqxHBi3HhSP
KQ5Zh0WLXgTFNOv8gjwIc1rtPNM2l0Yzi3ytpnB3jDQXk29t2CxUPXm2aXZRdA2g
TFTf+OqUExebB6XraV0b4/6if2O5gpmFfCdGVSoXuzFg7LKtmpD+rkc2blg833dv
GcbO/9nUbwKBgQCpTJ/TuIaJ8DfaPgms84OGhHOY3yI3rMU7KGIx5Eps6Ls39Avs
rjpX5EmwNKd8k4fxsHnWOOr60Pv0JSY5OP3M79E0SMM6uI0dnXGqvGT6w8btH0VC
EGxaTMd4Acm9O8Ga37+hanpmY08UuQYZMH7y1zw6e6GljhWibWDmH/mQVwKBgBpY
53ynUisFJX5SpVwYrnogBthkXkgQXHYbysKNKdVigZfYvujlMkeePaIZiwG/J9kz
Mx2JQXge8/pCoeZKa6UYu5mNn0v8km/Athi8vB4rQ5pUqY0XAn3FWJVVk2bQqnuG
l8kk7epZ2ZNJ3flo23hKvO0v7b0m9OOxIfhhcKt9AoGAaRibkQ+Xheyx2osMmx/5
f1+NzddMnmaVanLz9NbodpeiTv7Ny8Ig+Y9GywhFnXyodB/cQ7pvDWtlCgjWoo0j
taYugaU6N5bKTyRKYY7wSsbCXUyC2z8pS3ZGbJNFbZ9lYptFn9LpYXqaAzsx/ad7
V1v/OC73qmP95kdcjAfjnWY=
-----END PRIVATE KEY-----`;

export const privateKeyCert = `-----BEGIN CERTIFICATE-----
MIIEIDCCAwigAwIBAgIUL+MGp9n7+oPlQOaFrUZyqxoKakcwDQYJKoZIhvcNAQEL
BQAwgaAxCzAJBgNVBAYTAkJSMRowGAYDVQQIDBFSaW8gR3JhbmRlIGRvIFN1bDES
MBAGA1UEBwwJSWdyZWppbmhhMRQwEgYDVQQKDAtSb2NrZXQuQ2hhdDEQMA4GA1UE
CwwHQmFja2VuZDEPMA0GA1UEAwwGUGllcnJlMSgwJgYJKoZIhvcNAQkBFhlwaWVy
cmUubGVobmVuQHJvY2tldC5jaGF0MB4XDTIwMDYwMzIxMzIyMVoXDTIxMDYwMzIx
MzIyMVowgaAxCzAJBgNVBAYTAkJSMRowGAYDVQQIDBFSaW8gR3JhbmRlIGRvIFN1
bDESMBAGA1UEBwwJSWdyZWppbmhhMRQwEgYDVQQKDAtSb2NrZXQuQ2hhdDEQMA4G
A1UECwwHQmFja2VuZDEPMA0GA1UEAwwGUGllcnJlMSgwJgYJKoZIhvcNAQkBFhlw
aWVycmUubGVobmVuQHJvY2tldC5jaGF0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAovL3JW3wGm19Ay0UGKlwk4iVS/iNrgFYjLmcU28WPGM8fhShY0sq
orTFMnKbhGjO/gzJG90u38dzB+wW6avVCdAgfMxYvmNe+Ey0Jp3HbXoJfA5oWEzq
D6khwQz+Zv4B/9Cibgge3x23+WjARzjDFDJyZyd0JYkSxXg4xY/yP0s70C/kCJKp
GhH9JF7kNRNpb3YL7yRb3ndfTFNHeWqPViprQ2IkBA0zPgYWO+FFx1BUbx49ty6a
mJMGF+hyfmvy0X609K21fOvmCZ0fz5CoDU5e8LUVNZHCoMmoqf7BUMBTzlVKzJVn
fxI5vxIdDBb+lK4nMi2AQm8qfAvXFh1awQIDAQABo1AwTjAdBgNVHQ4EFgQUiVZJ
ITXceZdB0zdmBprHCdAYmhwwHwYDVR0jBBgwFoAUiVZJITXceZdB0zdmBprHCdAY
mhwwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEACfbUixYh/DdTWw7W
wDJZ9lA2ygx8i/mMUzi656LD/p79WRY0XhiM+3ecEEnsctjCHVeRF9ncIsx7TfZ0
XkrfQQN+InFQnyVgI/NxPQZQMheKvRFzcmIorcaCJWsPDyurK+h7sUFqn4Ax7R7x
IAcxgTaVmD0A1oQbYKjWApKiC+3sDJZIDE78zUneqa+zkH6+7W6H6ZyzwauVSYxq
bysEYp2E/oHvqazQiFwfxWTTrgqKS4VYhN4eV2BQeNRD93UqK8/YUdiNLugc06HH
fLBO7gBdTXqPlRt4IpjNSrtAEvwdhoUO51uvbRiTVoBkbeEbbkXd5cb3IlD3GIb3
PUdU7A==
-----END CERTIFICATE-----`;
