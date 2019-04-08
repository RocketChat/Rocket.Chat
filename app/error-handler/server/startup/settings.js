import { settings } from '../../../settings';

settings.addGroup('Logs', function() {
	this.add('Log_Exceptions_to_Channel', '', { type: 'string' });
});
