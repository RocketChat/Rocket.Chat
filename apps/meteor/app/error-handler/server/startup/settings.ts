import { settingsRegistry } from '../../../settings/server';

void settingsRegistry.addGroup('Logs', function () {
	this.add('Log_Exceptions_to_Channel', '', { type: 'string' });
});
