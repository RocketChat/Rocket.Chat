import { settings } from '../../../app/settings/server';
import { logLevel, LogLevelSetting } from './logLevel';

settings.get('Log_Level', (_key, value) => {
	if (value != null) {
		logLevel.emit('changed', String(value) as LogLevelSetting);
	}
});
