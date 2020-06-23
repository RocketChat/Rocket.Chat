import { hasLicense } from '../../license/client';
import '../lib/messageTypes';
import './views/livechatMonitors';
import './views/livechatUnits';
import './views/livechatUnitForm';
import './route';
import './views/livechatTags';
import './views/livechatTagForm';
import './views/livechatPriorities';
import './views/livechatPriorityForm';
import './views/business-hours/livechatBusinessHours';
import './startup';

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	require('./views/app/registerCustomTemplates');
	require('./views/livechatSideNavItems');
	require('./views/business-hours/Multiple');
});
