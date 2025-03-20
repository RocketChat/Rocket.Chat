<?php

$metadata['http://localhost:3000/_saml/metadata/test-sp'] = array (
	'entityid' => 'http://localhost:3000/_saml/metadata/test-sp',
	'contacts' => array (
	),
	'metadata-set' => 'saml20-sp-remote',
	'AssertionConsumerService' => array (
		0 => array (
			'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
			'Location' => 'http://localhost:3000/_saml/validate/test-sp',
			'index' => 1,
			'isDefault' => true,
		),
	),
	'SingleLogoutService' => array (
		0 => array (
			'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
			'Location' => 'http://localhost:3000/_saml/logout/test-sp/',
			'ResponseLocation' => 'http://localhost:3000/_saml/logout/test-sp/',
		),
	),
	'NameIDFormat' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
);