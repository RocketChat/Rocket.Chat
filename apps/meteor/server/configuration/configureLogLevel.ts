import { setQueueLimit, logLevel, type LogLevelSetting } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';

import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export async function configureLogLevel(settings: ICachedSettings) {
	const LogLevel = await Settings.getValueById('Log_Level');
	if (LogLevel) {
		logLevel.emit('changed', LogLevel as LogLevelSetting);
	}

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
}
