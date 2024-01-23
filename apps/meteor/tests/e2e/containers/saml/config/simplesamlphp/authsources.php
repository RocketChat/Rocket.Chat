<?php

$config = array(

	'admin' => array(
		'core:AdminPassword',
	),

	'example-userpass' => array(
		'exampleauth:UserPass',
		'samluser1:password' => array(
			'uid' => array('1'),
			'username' => 'samluser1',
			'cn' => 'Saml User 1',
			'eduPersonAffiliation' => array('group1'),
			'email' => 'samluser1@example.com',
		),
		'samluser2:password' => array(
			'uid' => array('2'),
			'username' => 'samluser2',
			'cn' => 'Saml User 2',
			'eduPersonAffiliation' => array('group2'),
			'email' => 'user_for_saml_merge@email.com',
		),
		'samluser3:password' => array(
			'uid' => array('3'),
			'username' => 'user_for_saml_merge2',
			'cn' => 'Saml User 3',
			'eduPersonAffiliation' => array('group2'),
			'email' => 'samluser3@example.com',
		),
	),

);