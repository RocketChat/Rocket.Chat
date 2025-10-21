import './meteor/overrides/ddpOverREST';
import './meteor/overrides/oauthRedirectUri';
import './meteor/overrides/unstoreLoginToken';
import './meteor/startup';
import './serviceWorker';

import('@rocket.chat/fuselage-polyfills')
	.then(() => import('./meteor/overrides'))
	.then(() => import('./ecdh'))
	.then(() => import('./importPackages'))
	.then(() => import('./startup'))
	.then(() => import('./omnichannel'))
	.then(() => Promise.all([import('./views/admin'), import('./views/marketplace'), import('./views/account')]));
