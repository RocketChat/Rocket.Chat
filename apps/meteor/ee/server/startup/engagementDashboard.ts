import { License } from '@rocket.chat/license';

	License.onToggledFeature('engagement-dashboard', {
		up: async () => {
			// Use sync require to avoid Meteor nested async import issues.
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const engagement = require('../lib/engagementDashboard/startup');
			const mod =
				engagement?.default?.default ??
				engagement?.default ??
				engagement;
			const { prepareAnalytics, attachCallbacks } = mod ?? {};
			if (typeof prepareAnalytics === 'function') {
				await prepareAnalytics();
			}
			if (typeof attachCallbacks === 'function') {
				attachCallbacks();
			}
		},
		down: async () => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const engagement = require('../lib/engagementDashboard/startup');
			const mod =
				engagement?.default?.default ??
				engagement?.default ??
				engagement;
			const { detachCallbacks } = mod ?? {};
			if (typeof detachCallbacks === 'function') {
				detachCallbacks();
			}
		},
	});
