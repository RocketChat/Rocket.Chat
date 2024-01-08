import './migrations';
import './appcache';
import './callbacks';
import './cron';
import './initialData';
import './serverRunning';
import './coreApps';
import './presenceTroubleshoot';
import '../hooks';
import '../lib/rooms/roomTypes';
import '../lib/settingsRegenerator';
import { isRunningMs } from '../lib/isRunningMs';

// only starts network broker if running in micro services mode
if (!isRunningMs()) {
	require('./localServices');
	require('./watchDb');
}
