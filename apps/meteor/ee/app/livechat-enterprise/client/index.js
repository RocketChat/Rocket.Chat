import { hasLicense } from '../../license/client';
import '../lib/messageTypes';
import './route';
import './startup';

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	require('./views/app/registerCustomTemplates');
	require('./views/livechatSideNavItems');
	require('./views/business-hours/Multiple');
	require('../lib/QuickActions/defaultActions');
	require('./messageTypes');
});
