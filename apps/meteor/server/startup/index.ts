import './migrations';
import './watchDb';
import './appcache';
import './callbacks';
import './cron';
import './initialData';
import './instance';
import './serverRunning';
import './coreApps';
import './presenceTroubleshoot';
import '../hooks';
import '../lib/rooms/roomTypes';
import { isRunningMs } from '../lib/isRunningMs';

// only starts network broker if running in micro services mode
if (!isRunningMs()) {
	require('./presence');
}
