import { SettingsVersion4 } from '../../../app/settings/server';
import { logLevel, LogLevelSetting } from './logLevel';
import { setQueueLimit } from './logQueue';

SettingsVersion4.watch('Log_Level', (value) => {
	if (value != null) {
		logLevel.emit('changed', String(value) as LogLevelSetting);
	}
});

SettingsVersion4.watch('Log_View_Limit', (value) => {
	if (typeof value === 'number') {
		setQueueLimit(value);
	}
});
