import { settingsRegistry } from '../../settings/server';

void settingsRegistry.addGroup('General', async function () {
	await this.section('Update', async function () {
		await this.add('Update_LatestAvailableVersion', '0.0.0', {
			type: 'string',
			readonly: true,
		});

		await this.add('Update_EnableChecker', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'Register_Server',
				value: true,
			},
			i18nDescription: 'Update_EnableChecker_Description',
		});
	});
});
