import { Meteor } from 'meteor/meteor';

import '../lib/messageTypes';
import './methods/addMonitor';
import './methods/getUnitsFromUserRoles';
import './methods/removeMonitor';
import './methods/removeTag';
import './methods/saveTag';
import './methods/removeUnit';
import './methods/saveUnit';
import './methods/savePriority';
import './methods/removePriority';
import './methods/removeBusinessHour';
import './methods/resumeOnHold';
import LivechatUnit from '../../models/server/models/LivechatUnit';
import LivechatTag from '../../models/server/models/LivechatTag';
import LivechatUnitMonitors from '../../models/server/models/LivechatUnitMonitors';
import './startup';
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

onLicense('livechat-enterprise', () => {
	require('./api');
	require('./hooks');
	const { createPermissions } = require('./permissions');
	const { createSettings } = require('./settings');

	Meteor.startup(function () {
		createSettings();
		createPermissions();
	});
});

export { LivechatUnit, LivechatTag, LivechatUnitMonitors };
