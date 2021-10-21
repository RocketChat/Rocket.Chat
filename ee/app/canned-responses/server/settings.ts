import { settingsRegistry } from '../../../../app/settings/server';

export const createSettings = (): void => {
	settingsRegistry.add('Canned_Responses_Enable', true, {
		group: 'Omnichannel',
		section: 'Canned_Responses',
		type: 'boolean',
		public: true,
		enterprise: true,
		invalidValue: false,
		modules: [
			'canned-responses',
		],
	});
};
