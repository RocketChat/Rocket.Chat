import { Meteor } from 'meteor/meteor';

import './lib/queueWorker';

import LivechatUnit from '../../models/server/models/LivechatUnit';
import LivechatTag from '../../models/server/models/LivechatTag';
import LivechatUnitMonitors from '../../models/server/models/LivechatUnitMonitors';
import { onLicense } from '../../license/server';
import { createPermissions } from './permissions';
import { createSettings } from './settings';


onLicense('livechat-enterprise', () => {
	require('../lib/messageTypes');
	require('./methods/addMonitor');
	require('./methods/getUnitsFromUserRoles');
	require('./methods/removeMonitor');
	require('./methods/removeTag');
	require('./methods/saveTag');
	require('./methods/removeUnit');
	require('./methods/saveUnit');
	require('./methods/savePriority');
	require('./methods/removePriority');
	require('./methods/removeBusinessHour');
	require('./methods/resumeOnHold');
	require('./startup');
	require('./hooks/afterTakeInquiry');
	require('./hooks/beforeNewInquiry');
	require('./hooks/beforeNewRoom');
	require('./hooks/beforeRoutingChat');
	require('./hooks/checkAgentBeforeTakeInquiry');
	require('./hooks/handleNextAgentPreferredEvents');
	require('./hooks/onCheckRoomParamsApi');
	require('./hooks/onLoadConfigApi');
	require('./hooks/onCloseLivechat');
	require('./hooks/onSaveVisitorInfo');
	require('./hooks/scheduleAutoTransfer');
	require('./hooks/resumeOnHold');
	require('./hooks/afterOnHold');
	require('./hooks/onTransferFailure');
	require('./lib/routing/LoadBalancing');
	require('./lib/routing/LoadRotation');
	require('./lib/AutoCloseOnHoldScheduler');
	require('./business-hour');
	require('./api');
	require('./hooks');

	Meteor.startup(function() {
		createSettings();
		createPermissions();
	});
});

export {
	LivechatUnit,
	LivechatTag,
	LivechatUnitMonitors,
};
