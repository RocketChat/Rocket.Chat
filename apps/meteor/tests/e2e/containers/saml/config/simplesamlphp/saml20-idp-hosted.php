<?php

$metadata['http://localhost:3000/_saml/metadata/test-sp'] = [
    'entityid' => 'http://localhost:3000/_saml/metadata/test-sp',
    'host' => '__DEFAULT__',
    'privatekey' => 'server.pem',
    'certificate' => 'server.crt',
    'auth' => 'example-userpass',
    'redirect.sign' => true,

    /*
     * Force the NameID to be the raw email attribute value in emailAddress
     * format, bypassing SimpleSAMLphp's default persistent (hashed) nameID
     * generation.
     */
    'authproc' => [
        100 => [
            'class' => 'saml:AttributeNameID',
            'attribute' => 'email',
            'Format' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        ],
    ],
];
