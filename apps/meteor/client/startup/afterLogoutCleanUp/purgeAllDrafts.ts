import { Meteor } from 'meteor/meteor';

import { purgeAllDrafts } from '../../../app/ui-message/client/messageBox/messageBox';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	callbacks.add('afterLogoutCleanUp', purgeAllDrafts, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');
});
