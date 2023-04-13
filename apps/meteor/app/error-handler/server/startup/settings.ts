import { settingsRegistry } from '../../../settings/server';

void settingsRegistry.addGroup('Logs', async function () {
	await this.add('Log_Exceptions_to_Channel', '', { type: 'string' });
});
