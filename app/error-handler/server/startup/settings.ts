import { settingsRegister } from '../../../settings/server';

settingsRegister.addGroup('Logs', function() {
	this.add('Log_Exceptions_to_Channel', '', { type: 'string' });
});
