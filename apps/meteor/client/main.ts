import { FlowRouter } from 'meteor/kadira:flow-router';

FlowRouter.wait();

FlowRouter.notFound = {
	action: () => undefined,
};

import('./polyfills')
	.then(() =>
		Promise.all([
			import('./meteorOverrides/ddpOverREST'),
			import('./meteorOverrides/totpOnCall'),
			import('./meteorOverrides/oauthRedirectUri'),
			import('./meteorOverrides/userAndUsers'),
			import('./meteorOverrides/login/cas'),
			import('./meteorOverrides/login/crowd'),
			import('./meteorOverrides/login/google'),
			import('./meteorOverrides/login/ldap'),
			import('./meteorOverrides/login/oauth'),
			import('./meteorOverrides/login/password'),
			import('./meteorOverrides/login/saml'),
		]),
	)
	.then(() => import('../ee/client/ecdh'))
	.then(() => import('./importPackages'))
	.then(() => Promise.all([import('./methods'), import('./startup')]))
	.then(() => import('../ee/client'))
	.then(() => Promise.all([import('./views/admin'), import('./views/marketplace'), import('./views/account')]));
