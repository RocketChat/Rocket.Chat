import './engagementDashboard';
import './seatsCap';
import './services';
import { isRunningMs } from '../../../server/lib/isRunningMs';

// only starts network broker if running in micro services mode
if (isRunningMs()) {
	require('./broker');
}
