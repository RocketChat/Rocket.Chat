import '../apps/startup';
import '../../app/authorization/server';
import './apps';
import './audit';
import './deviceManagement';
import './engagementDashboard';
import './maxRoomsPerGuest';
import './services';
import './upsell';

import { isRunningMs } from '../../../server/lib/isRunningMs';

if (!isRunningMs()) {
	require('./presence');
}
