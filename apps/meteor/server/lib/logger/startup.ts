import { setQueueLimit, logLevel, type LogLevelSetting } from '@rocket.chat/logger';

import { settings } from '../../../app/settings/server';

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
