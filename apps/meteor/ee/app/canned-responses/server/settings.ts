import { settingsRegistry } from '../../../../app/settings/server';

const omnichannelEnabledQuery = { _id: 'Livechat_enabled', value: true };

export const createSettings = (): void => {
	settingsRegistry.add('Canned_Responses_Enable', true, {
		group: 'Omnichannel',
		section: 'Canned_Responses',
		type: 'boolean',
		public: true,
		enterprise: true,
		invalidValue: false,
		modules: ['canned-responses'],
		enableQuery: omnichannelEnabledQuery,
	});
};
