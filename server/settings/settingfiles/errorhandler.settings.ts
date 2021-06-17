import { settings } from '..';

settings.addGroup('Logs', function() {
	this.add('Log_Exceptions_to_Channel', '', { type: 'string' });
});
