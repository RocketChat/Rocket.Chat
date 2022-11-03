import { Meteor } from 'meteor/meteor';

import { messageBoxState } from '../../../app/ui/client/lib/messageBoxState';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	callbacks.add('afterLogoutCleanUp', messageBoxState.purgeAll, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');
});
