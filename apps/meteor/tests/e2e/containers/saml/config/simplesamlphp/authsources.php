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
		'samluser4:password' => array(
			'uid' => array('4'),
			'username' => 'samluser4',
			'cn' => 'Saml User 4',
			'eduPersonAffiliation' => array('group4'),
			'email' => 'samluser4@example.com',
			'role' => 'saml-role',
		),
		'samluser5:password' => array(
			'uid' => array('5'),
			'username' => 'samluser5',
			'eduPersonAffiliation' => array('group5'),
			'email' => 'samluser5@example.com',
		),
		'samluser6:password' => array(
			'uid' => array('6'),
			'username' => 'samluser6',
			'displayName' => 'Saml User 6 Display Name',
			'eduPersonAffiliation' => array('group6'),
			'email' => 'samluser6@example.com',
		),
		'samluser7:password' => array(
			'uid' => array('7'),
			'username' => 'samluser7',
			'cn' => 'Saml User 7',
			'eduPersonAffiliation' => array('group7'),
			'email' => 'samluser7@example.com',
			'channels' => array('saml-channel-1', 'saml-channel-2'),
		),
	),
);