import { settings } from '../../../../app/settings';

export const createSettings = () => {
	settings.addGroup('Canned_Responses');

	settings.add('Canned_Responses_Enable', true, {
		group: 'Canned_Responses',
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
