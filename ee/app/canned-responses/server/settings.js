import { settings } from '../../../../app/settings';

export const createSettings = () => {
	settings.addGroup('Canned_Responses', function() {
		this.section('Canned_Responses', function() {
			this.add('Canned_Responses_Enable', false, {
				type: 'boolean',
				public: true,
				enterprise: true,
				invalidValue: false,
				modules: [
					'canned-responses',
				],
			});
		});
	});
};
