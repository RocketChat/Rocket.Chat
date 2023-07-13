import { hasLicense } from '../../license/client';
import './startup';

void hasLicense('livechat-enterprise').then(async (enabled) => {
	if (!enabled) {
		return;
	}

	await import('./views/business-hours/Multiple');
	await import('../lib/QuickActions/defaultActions');
});
