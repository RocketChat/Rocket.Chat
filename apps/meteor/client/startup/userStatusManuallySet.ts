import { Meteor } from 'meteor/meteor';

import { UserStatus } from '@rocket.chat/core-typings';
import { callbacks } from '../../lib/callbacks';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

/* fire user state change globally, to listen on desktop electron client */
Meteor.startup(() => {
	callbacks.add('userStatusManuallySet', (status: UserStatus) => {
		fireGlobalEvent('user-status-manually-set', status);
	});
});
