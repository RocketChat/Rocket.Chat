import { License } from '@rocket.chat/license';

License.onToggledFeature('engagement-dashboard', {
	up: async () => {
		const { prepareAnalytics, attachCallbacks } = await import('../lib/engagementDashboard/startup');
		await prepareAnalytics();
		attachCallbacks();
		await import('../api/engagementDashboard');
	},
	down: async () => {
		const { detachCallbacks } = await import('../lib/engagementDashboard/startup');
		detachCallbacks();
	},
});
