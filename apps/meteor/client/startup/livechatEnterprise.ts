import { onToggledFeature } from '../lib/onToggledFeature';

const loadSideNavItems = () => import('../lib/omnichannel/livechatEnterprise/livechatSideNavItems');

onToggledFeature('livechat-enterprise', {
	up: () => {
		void loadSideNavItems().then(({ registerLivechatEnterpriseSidebarItems }) => registerLivechatEnterpriseSidebarItems());
	},
	down: () => {
		void loadSideNavItems().then(({ unregisterLivechatEnterpriseSidebarItems }) => unregisterLivechatEnterpriseSidebarItems());
	},
});
