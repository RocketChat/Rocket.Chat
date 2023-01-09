import './deviceManagement';
import './engagementDashboard';
import './seatsCap';
import './services';
import './upsell';
import { api } from '@rocket.chat/core-services';

import { isRunningMs } from '../../../server/lib/isRunningMs';

// only starts network broker if running in micro services mode
if (isRunningMs()) {
	(async () => {
		const { broker } = await import('./broker');

		api.setBroker(broker);
		api.start();
	})();
}
