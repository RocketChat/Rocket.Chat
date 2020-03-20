import { hasLicense } from '../../license/client';
import './views/livechatMonitors';
import './views/livechatUnits';
import './views/livechatUnitForm';
import './route';
import './views/livechatTags';
import './views/livechatTagForm';

hasLicense('livechat-enterprise').then((enabled) => {
	if (!enabled) {
		return;
	}

	require('./views/app/registerCustomTemplates');
	require('./views/livechatSideNavItems');
});
