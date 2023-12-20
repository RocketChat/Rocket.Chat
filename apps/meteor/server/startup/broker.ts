import { isRunningMs } from '../lib/isRunningMs';

// only starts network broker if running in micro services mode
if (!isRunningMs()) {
	require('./localServices');
}
