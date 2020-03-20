import { addSidebarItem } from '../../../../../app/livechat/client/views/sideNav/livechatSideNavItems';
import { hasLicense } from '../../../license/client';

hasLicense('livechat-enterprise').then((enabled) => {
	if (enabled) {
		addSidebarItem('Monitors', 'livechat-monitors', 'manage-livechat-monitors');
		addSidebarItem('Units', 'livechat-units', 'manage-livechat-units');
		addSidebarItem('Tags', 'livechat-tags', 'manage-livechat-tags');
	}
});
