import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('General', function () {
	this.section('Update', function () {
		this.add('Update_LatestAvailableVersion', '0.0.0', {
			type: 'string',
			readonly: true,
		});

		this.add('Update_EnableChecker', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'Register_Server',
				value: true,
			},
			i18nDescription: 'Update_EnableChecker_Description',
		});
	});
});
