import './serviceWorker';
import './meteor/startup/absoluteUrl';
import './meteor/startup/accounts';

import('@rocket.chat/fuselage-polyfills')
	.then(() => import('./meteor/overrides'))
	.then(() => import('./ecdh'))
	.then(() => import('./importPackages'))
	.then(() => import('./startup'))
	.then(() => import('./omnichannel'))
	.then(() => Promise.all([import('./views/admin'), import('./views/marketplace'), import('./views/account')]));
