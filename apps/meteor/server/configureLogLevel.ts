import type { LogLevelSetting } from '@rocket.chat/logger';
import { logLevel } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';

const LogLevel = await Settings.getValueById('Log_Level');
if (LogLevel) {
	logLevel.emit('changed', LogLevel as LogLevelSetting);
}
