import { settings } from '../../../app/settings/server';
import type { LogLevelSetting } from './logLevel';
import { logLevel } from './logLevel';
import { setQueueLimit } from './logQueue';

settings.watch('Log_Level', (value) => {
	if (value != null) {
		logLevel.emit('changed', String(value) as LogLevelSetting);
	}
});

settings.watch('Log_View_Limit', (value) => {
	if (typeof value === 'number') {
		setQueueLimit(value);
	}
});
