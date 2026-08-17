import './meteor/overrides';
import './meteor/startup';
import './lib/sdk/ddpSdk';
import './serviceWorker';

import('./meteor/login')
	.then(() => import('./importPackages'))
	.then(() => import('./startup'))
	.then(() =>
		Promise.all([import('./views/omnichannel'), import('./views/admin'), import('./views/marketplace'), import('./views/account')]),
	);
