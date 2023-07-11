import { hasLicense } from '../../license/client';
import '../lib/messageTypes';
import './startup';

void hasLicense('livechat-enterprise').then(async (enabled) => {
	if (!enabled) {
		return;
	}

	await import('./views/livechatSideNavItems');
	await import('./views/business-hours/Multiple');
	await import('../lib/QuickActions/defaultActions');
	await import('./messageTypes');
});
