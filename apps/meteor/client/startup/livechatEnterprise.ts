import { onToggledFeature } from '../lib/onToggledFeature';

onToggledFeature('livechat-enterprise', {
	up: () => {
		void Promise.all([
			import('../lib/omnichannel/livechatEnterprise/livechatSideNavItems'),
			import('../lib/omnichannel/businessHours/MultipleBusinessHoursBehavior'),
		]);
	},
});
