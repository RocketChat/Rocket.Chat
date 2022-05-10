import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { fireGlobalEvent } from '../../lib/utils/fireGlobalEvent';

Meteor.startup(() => {
	callbacks.add('afterLogoutCleanUp', () => fireGlobalEvent('Custom_Script_On_Logout'), callbacks.priority.LOW, 'custom-script-on-logout');
});
