import { FlowRouter } from 'meteor/kadira:flow-router';

FlowRouter.wait();

FlowRouter.notFound = {
	action: () => undefined,
};

import('./polyfills')
	.then(() => Promise.all([import('./lib/meteorCallWrapper'), import('../lib/oauthRedirectUriClient')]))
	.then(() => import('../ee/client/ecdh'))
	.then(() => import('./importPackages'))
	.then(() => Promise.all([import('./methods'), import('./startup')]))
	.then(() => import('../ee/client'))
	.then(() => Promise.all([import('./views/admin'), import('./views/marketplace'), import('./views/account')]));
