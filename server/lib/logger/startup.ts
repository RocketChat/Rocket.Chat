import { settings } from '../../../app/settings/server';
import { logLevel, LogLevelSetting } from './logLevel';
import { setQueueLimit } from './logQueue';

settings.get('Log_Level', (_key, value) => {
	if (value != null) {
		logLevel.emit('changed', String(value) as LogLevelSetting);
	}
});

settings.get('Log_View_Limit', (_key, value) => {
	if (typeof value === 'number') {
		setQueueLimit(value);
	}
});
