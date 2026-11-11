import { Info } from '../rocketchat.info';
import { installDesktopRequire } from './lib/desktopRequire';
import './meteor/startup';
import './lib/sdk/ddpSdk';
import './serviceWorker';

installDesktopRequire(window, Info);

import('./meteor/login')
	.then(() => import('./startup'))
	.then(() =>
		Promise.all([import('./views/omnichannel'), import('./views/admin'), import('./views/marketplace'), import('./views/account')]),
	);
