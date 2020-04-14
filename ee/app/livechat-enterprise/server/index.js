import { Meteor } from 'meteor/meteor';

import './hooks/addDepartmentAncestors';
import './hooks/afterForwardChatToDepartment';
import './hooks/beforeListTags';
import './hooks/setPredictedVisitorAbandonmentTime';
import './methods/addMonitor';
import './methods/getUnitsFromUserRoles';
import './methods/removeMonitor';
import './methods/removeTag';
import './methods/saveTag';
import './methods/removeUnit';
import './methods/saveUnit';
import LivechatUnit from '../../models/server/models/LivechatUnit';
import LivechatTag from '../../models/server/models/LivechatTag';
import LivechatUnitMonitors from '../../models/server/models/LivechatUnitMonitors';
import './agentStatus';
import './startup';
import './hooks/afterTakeInquiry';
import './hooks/beforeRoutingChat';
import './hooks/checkAgentBeforeTakeInquiry';
import './hooks/onLoadConfigApi';
import './hooks/onSetUserStatusLivechat';
import './hooks/onCloseLivechat';
import './lib/routing/LoadBalancing';
import { onLicense } from '../../license/server';

onLicense('livechat-enterprise', () => {
	require('./api');
	const { createPermissions } = require('./permissions');
	const { createSettings } = require('./settings');

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
