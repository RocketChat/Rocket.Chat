import { settings } from '../../../../app/settings';

export const createSettings = () => {
	settings.addGroup('Canned Responses', function() {
		this.section('Canned Responses', function() {
			this.add('Canned_Responses_Enable', false, {
				type: 'boolean',
				public: true,
			});
		});
	});
};
