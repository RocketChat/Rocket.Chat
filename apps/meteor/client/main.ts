import './serviceWorker';
import './startup/accounts';

import('@rocket.chat/fuselage-polyfills')
	.then(() => import('./meteorOverrides'))
	.then(() => import('./ecdh'))
	.then(() => import('./importPackages'))
	.then(() => import('./startup'))
	.then(() => import('./omnichannel'))
	.then(() => Promise.all([import('./views/admin'), import('./views/marketplace'), import('./views/account')]));
