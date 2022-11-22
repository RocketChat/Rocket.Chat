import { Meteor } from 'meteor/meteor';

import { ChatMessages } from '../../../app/ui/client';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	callbacks.add('afterLogoutCleanUp', ChatMessages.purgeAllDrafts, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');
});
