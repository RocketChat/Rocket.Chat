import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { afterLogoutCleanUpCallback } from '../../../lib/callbacks/afterLogoutCleanUpCallback';
import { fireGlobalEvent } from '../../lib/utils/fireGlobalEvent';

Meteor.startup(() => {
	afterLogoutCleanUpCallback.add(async () => fireGlobalEvent('Custom_Script_On_Logout'), callbacks.priority.LOW, 'custom-script-on-logout');
});
