import './serviceWorker';
import './startup/fakeUserPresence';
import './meteor/overrides';
import './meteor/startup';

import('@rocket.chat/fuselage-polyfills')
	.then(() => import('./ecdh'))
	.then(() => import('./importPackages'))
	.then(() => import('./startup'))
	.then(() =>
		Promise.all([import('./views/omnichannel'), import('./views/admin'), import('./views/marketplace'), import('./views/account')]),
	);
