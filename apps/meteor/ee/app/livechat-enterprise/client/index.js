import { hasLicense } from '../../license/client';
import '../lib/messageTypes';
import './startup';

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	require('./views/livechatSideNavItems');
	require('./views/business-hours/Multiple');
	require('../lib/QuickActions/defaultActions');
	require('./messageTypes');
});
