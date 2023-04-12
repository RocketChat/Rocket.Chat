import { Meteor } from 'meteor/meteor';

import './methods/addMonitor';
import './methods/getUnitsFromUserRoles';
import './methods/removeMonitor';
import './methods/removeTag';
import './methods/saveTag';
import './methods/removeUnit';
import './methods/saveUnit';
import './methods/removeBusinessHour';
import './methods/resumeOnHold';
import './hooks/afterTakeInquiry';
import './hooks/beforeNewInquiry';
import './hooks/beforeNewRoom';
import './hooks/beforeRoutingChat';
import './hooks/checkAgentBeforeTakeInquiry';
import './hooks/handleNextAgentPreferredEvents';
import './hooks/onCheckRoomParamsApi';
import './hooks/onLoadConfigApi';
import './hooks/onCloseLivechat';
import './hooks/onSaveVisitorInfo';
import './hooks/scheduleAutoTransfer';
import './hooks/resumeOnHold';
import './hooks/afterOnHold';
import './hooks/onTransferFailure';
import './lib/routing/LoadBalancing';
import './lib/routing/LoadRotation';
import './lib/AutoCloseOnHoldScheduler';
import { onLicense } from '../../license/server';
import './business-hour';
import { createDefaultPriorities } from './priorities';

await onLicense('livechat-enterprise', async () => {
	require('./api');
	require('./hooks');
	await import('./startup');
	const { createPermissions } = await import('./permissions');
	const { createSettings } = await import('./settings');

	Meteor.startup(function () {
		void createSettings();
		void createPermissions();
		void createDefaultPriorities();
	});
});
