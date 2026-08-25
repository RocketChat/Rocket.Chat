import { onToggledFeature } from '../lib/onToggledFeature';

onToggledFeature('livechat-enterprise', {
	up: () => {
		void import('../lib/omnichannel/livechatEnterprise/livechatSideNavItems');
	},
});
