import './meteor/overrides';
import './meteor/startup';
import './serviceWorker';

import('@rocket.chat/fuselage-polyfills')
	.then(() => import('./meteor/login'))
	.then(() => import('./ecdh'))
	.then(() => import('./importPackages'))
	.then(() => import('./startup'))
	.then(() =>
		Promise.all([import('./views/omnichannel'), import('./views/admin'), import('./views/marketplace'), import('./views/account')]),
	);
