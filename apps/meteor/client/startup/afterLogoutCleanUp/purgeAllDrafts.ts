import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../lib/callbacks';
import { purgeAllDrafts } from '../../lib/chats/composer';

Meteor.startup(() => {
	callbacks.add('afterLogoutCleanUp', purgeAllDrafts, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');
});
